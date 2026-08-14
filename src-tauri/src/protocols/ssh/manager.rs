use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use tauri::ipc::Channel;
use uuid::Uuid;
use zeroize::Zeroize;

use crate::core::CredentialType;
use crate::error::AppError;
use crate::protocols::ssh::client::SshClientHandler;
use crate::protocols::ssh::known_hosts::KnownHostsStore;
use crate::protocols::ssh::session::{ActiveSession, SshEvent};
use crate::vault::SecretPayload;

pub struct SshSessionManager {
    sessions: Arc<Mutex<HashMap<String, ActiveSession>>>,
    pub known_hosts: KnownHostsStore,
}

impl SshSessionManager {
    pub fn new(app_dir: std::path::PathBuf) -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            known_hosts: KnownHostsStore::new(app_dir),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start_session(

        &self,
        connection_id: String,
        host: String,
        port: u16,
        username: String,
        credential_type: Option<CredentialType>,
        mut secret: Option<SecretPayload>,
        cols: u32,
        rows: u32,
        on_event: Channel<SshEvent>,
    ) -> Result<String, AppError> {
        let session_id = Uuid::new_v4().to_string();

        let (clean_host, clean_port, clean_username) = sanitize_target_host_and_port(&host, port, &username);

        let _ = on_event.send(SshEvent::Status("CONNECTING".into()));

        // Connect TCP socket to remote host
        let config = Arc::new(russh::client::Config::default());
        let handler = SshClientHandler::new();

        let addr = format!("{}:{}", clean_host, clean_port);
        let mut handle = tokio::time::timeout(
            std::time::Duration::from_secs(10),
            russh::client::connect(config, &addr, handler),
        )
        .await
        .map_err(|_| AppError::SshError("Timeout al conectar con el servidor SSH".into()))?
        .map_err(|e| AppError::SshError(format!("Fallo de conexión TCP/SSH: {}", e)))?;

        let username = clean_username;


        // Authenticate
        let auth_success = if let Some(sec) = &secret {
            let secret_str = sec.expose_secret();

            match credential_type.unwrap_or(CredentialType::Password) {
                CredentialType::Password => {
                    let mut success = handle
                        .authenticate_password(&username, secret_str)
                        .await
                        .map_err(|e| AppError::SshError(format!("Fallo de autenticación por contraseña: {}", e)))?;

                    if !success {
                        // Fallback to keyboard-interactive authentication for PAM-enabled Linux SSH daemons
                        if let Ok(russh::client::KeyboardInteractiveAuthResponse::Success) =
                            handle.authenticate_keyboard_interactive_respond(vec![secret_str.to_string()]).await
                        {
                            success = true;
                        }
                    }
                    success
                }


                CredentialType::PrivateKey | CredentialType::PassphraseKey => {
                    let key_pair = russh_keys::decode_secret_key(secret_str, None)
                        .map_err(|e| AppError::SshError(format!("Formato de clave privada SSH inválido: {}", e)))?;

                    let key_with_alg = russh_keys::key::PrivateKeyWithHashAlg::new(
                        Arc::new(key_pair),
                        None,
                    ).map_err(|e| AppError::SshError(format!("Algoritmo de clave privada inválido: {}", e)))?;

                    handle
                        .authenticate_publickey(&username, key_with_alg)
                        .await
                        .map_err(|e| AppError::SshError(format!("Fallo de autenticación por clave privada: {}", e)))?
                }
            }
        } else {
            handle
                .authenticate_none(&username)
                .await
                .map_err(|e| AppError::SshError(format!("Fallo de autenticación sin credenciales: {}", e)))?
        };

        // Zeroize secret payload immediately after authentication
        if let Some(mut sec) = secret.take() {
            sec.zeroize();
        }

        if !auth_success {
            let _ = on_event.send(SshEvent::Status("ERROR".into()));
            let _ = on_event.send(SshEvent::Error("Autenticación SSH rechazada por el servidor".into()));
            return Err(AppError::SshError("Autenticación SSH rechazada por el servidor".into()));
        }

        // Open PTY channel
        let channel = handle
            .channel_open_session()
            .await
            .map_err(|e| AppError::SshError(format!("No se pudo abrir la sesión de canal SSH: {}", e)))?;


        channel
            .request_pty(
                false,
                "xterm-256color",
                cols,
                rows,
                0,
                0,
                &[],
            )
            .await
            .map_err(|e| AppError::SshError(format!("Fallo al solicitar PTY interactivo: {}", e)))?;

        channel
            .request_shell(false)
            .await
            .map_err(|e| AppError::SshError(format!("Fallo al solicitar shell interactivo: {}", e)))?;

        let _ = on_event.send(SshEvent::Status("CONNECTED".into()));

        // Channels for PTY communication
        let (tx_input, mut rx_input) = mpsc::channel::<Vec<u8>>(256);
        let (tx_resize, mut rx_resize) = mpsc::channel::<(u32, u32)>(32);
        let running = Arc::new(AtomicBool::new(true));
        let running_clone = running.clone();

        let session_id_clone = session_id.clone();
        let sessions_map = self.sessions.clone();

        // Spawn Tokio background task for bidirectional PTY streaming
        tokio::spawn(async move {
            let mut channel_stream = channel.into_stream();

            use tokio::io::{AsyncReadExt, AsyncWriteExt};

            let mut buf = [0u8; 8192];

            while running_clone.load(Ordering::SeqCst) {
                tokio::select! {
                    // Incoming data from remote SSH server PTY
                    read_res = channel_stream.read(&mut buf) => {
                        match read_res {
                            Ok(0) => {
                                let _ = on_event.send(SshEvent::Status("DISCONNECTED".into()));
                                let _ = on_event.send(SshEvent::Exit(0));
                                break;
                            }
                            Ok(n) => {
                                let _ = on_event.send(SshEvent::Output(buf[..n].to_vec()));
                            }
                            Err(e) => {
                                let _ = on_event.send(SshEvent::Error(format!("Error de lectura SSH: {}", e)));
                                break;
                            }
                        }
                    }

                    // User input from React frontend
                    Some(input_data) = rx_input.recv() => {
                        if let Err(e) = channel_stream.write_all(&input_data).await {
                            let _ = on_event.send(SshEvent::Error(format!("Error al enviar datos: {}", e)));
                            break;
                        }
                    }

                    // Window resize from React frontend
                    Some((_c, _r)) = rx_resize.recv() => {
                        // Window change
                    }
                }
            }

            // Cleanup session from map on exit
            if let Ok(mut map) = sessions_map.lock() {
                map.remove(&session_id_clone);
            }
        });

        // Store active session handle
        let active_session = ActiveSession {
            id: session_id.clone(),
            connection_id,
            tx_input,
            tx_resize,
            running,
        };

        if let Ok(mut map) = self.sessions.lock() {
            map.insert(session_id.clone(), active_session);
        }

        Ok(session_id)
    }

    pub fn send_input(&self, session_id: &str, data: Vec<u8>) -> Result<(), AppError> {
        let map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
        if let Some(session) = map.get(session_id) {
            session.send_input(data).map_err(AppError::SshError)?;
            Ok(())
        } else {
            Err(AppError::NotFound(format!("Sesión SSH {} no encontrada", session_id)))
        }
    }

    pub fn resize_pty(&self, session_id: &str, cols: u32, rows: u32) -> Result<(), AppError> {
        let map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
        if let Some(session) = map.get(session_id) {
            session.resize_pty(cols, rows).map_err(AppError::SshError)?;
            Ok(())
        } else {
            Err(AppError::NotFound(format!("Sesión SSH {} no encontrada", session_id)))
        }
    }

    pub fn disconnect(&self, session_id: &str) -> Result<(), AppError> {
        let mut map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
        if let Some(session) = map.remove(session_id) {
            session.stop();
            Ok(())
        } else {
            Err(AppError::NotFound(format!("Sesión SSH {} no encontrada", session_id)))
        }
    }
}

pub fn sanitize_target_host_and_port(raw_host: &str, raw_port: u16, raw_username: &str) -> (String, u16, String) {
    let mut clean_host = raw_host.trim().to_string();
    let mut clean_username = raw_username.trim().to_string();
    let mut clean_port = raw_port;

    // Extract username if present in host (e.g. root@10.100.10.5)
    if let Some((user_part, host_part)) = clean_host.clone().split_once('@') {
        if !user_part.is_empty() {
            clean_username = user_part.to_string();
        }
        clean_host = host_part.to_string();
    }

    // Extract port if present in host (e.g. 10.100.10.5:22 or PVE1:8006)
    if let Some((host_part, port_part)) = clean_host.clone().rsplit_once(':') {
        if let Ok(parsed_port) = port_part.parse::<u16>() {
            clean_port = parsed_port;
            clean_host = host_part.to_string();
        }
    }

    if clean_port == 0 {
        clean_port = 22;
    }

    (clean_host, clean_port, clean_username)
}

