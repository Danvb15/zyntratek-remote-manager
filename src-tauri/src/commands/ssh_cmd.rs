use std::sync::Arc;
use std::net::TcpStream;
use std::time::Instant;
use std::io::Read;
use std::path::Path;
use ssh2::Session;
use serde::{Serialize, Deserialize};
use tauri::{ipc::Channel, State};

use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::protocols::ssh::session::SshEvent;
use crate::protocols::SshSessionManager;
use crate::vault::SecretStore;
use crate::core::CredentialType;
use crate::vault::SecretPayload;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerHealthMetrics {
    pub uptime: String,
    pub load_average: String,
    pub cpu_cores: u32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_percent: u32,
    pub disk_used: String,
    pub disk_total: String,
    pub disk_percent: String,
    pub os_info: String,
    pub ping_ms: u32,
}

#[tauri::command]
pub async fn start_ssh_session(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    ssh_manager: State<'_, Arc<SshSessionManager>>,
    connection_id: String,
    cols: u32,
    rows: u32,
    manual_password: Option<String>,
    on_event: Channel<SshEvent>,
) -> Result<String, AppError> {
    // 1. Get Connection metadata from SQLite
    let connection = {
        let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
        Repository::get_connection(&conn, &connection_id)?
    };

    // 2. Fetch credential metadata and secret from OS Keyring (if attached) or manual_password
    let (credential_type, secret) = if let Some(pass) = manual_password {
        if !pass.trim().is_empty() {
            (
                Some(CredentialType::Password),
                Some(SecretPayload::new(pass)),
            )
        } else {
            (None, None)
        }
    } else if let Some(cred_id) = &connection.credential_id {
        let meta = {
            let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
            Repository::get_credential_metadata(&conn, cred_id)?
        };
        match vault.get_secret(cred_id) {
            Ok(sec) => (Some(meta.credential_type), Some(sec)),
            Err(_) => {
                return Err(AppError::VaultError(
                    "Credencial no encontrada en el almacén de Windows. Por favor ingresa tu contraseña para guardar y continuar.".into(),
                ));
            }
        }
    } else {
        (None, None)
    };

    // 3. Initiate the SSH session via the background session manager
    ssh_manager
        .start_session(
            connection_id,
            connection.host,
            connection.port,
            connection.username,
            credential_type,
            secret,
            cols,
            rows,
            on_event,
        )
        .await
}

#[tauri::command]
pub fn send_ssh_input(
    ssh_manager: State<'_, Arc<SshSessionManager>>,
    session_id: String,
    data: Vec<u8>,
) -> Result<(), AppError> {
    ssh_manager.send_input(&session_id, data)
}

#[tauri::command]
pub fn resize_ssh_pty(
    ssh_manager: State<'_, Arc<SshSessionManager>>,
    session_id: String,
    cols: u32,
    rows: u32,
) -> Result<(), AppError> {
    ssh_manager.resize_pty(&session_id, cols, rows)
}

#[tauri::command]
pub fn disconnect_ssh_session(
    ssh_manager: State<'_, Arc<SshSessionManager>>,
    session_id: String,
) -> Result<(), AppError> {
    ssh_manager.disconnect(&session_id)
}

#[tauri::command]
pub fn trust_ssh_host(
    ssh_manager: State<'_, Arc<SshSessionManager>>,
    host: String,
    port: u16,
    key_type: String,
    fingerprint: String,
) -> Result<(), AppError> {
    ssh_manager.known_hosts.trust_host(&host, port, &key_type, &fingerprint)
}

#[tauri::command]
pub async fn get_server_health(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    manual_password: Option<String>,
) -> Result<ServerHealthMetrics, AppError> {
    let connection = {
        let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
        Repository::get_connection(&conn, &connection_id)?
    };

    let host = &connection.host;
    let port = connection.port;
    let username = &connection.username;

    let start_time = Instant::now();
    let tcp = TcpStream::connect((host.as_str(), port)).map_err(|e| {
        AppError::SshError(format!("No se pudo conectar a {}:{}: {}", host, port, e))
    })?;
    let ping_ms = start_time.elapsed().as_millis() as u32;

    let mut sess = Session::new().map_err(|e| {
        AppError::SshError(format!("Error inicializando sesión SSH: {}", e))
    })?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| {
        AppError::SshError(format!("Error en handshake SSH con {}: {}", host, e))
    })?;

    let (credential_type, secret) = if let Some(pass) = manual_password {
        if !pass.trim().is_empty() {
            (Some(CredentialType::Password), Some(SecretPayload::new(pass)))
        } else {
            (None, None)
        }
    } else if let Some(cred_id) = &connection.credential_id {
        let meta = {
            let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
            Repository::get_credential_metadata(&conn, cred_id)?
        };
        match vault.get_secret(cred_id) {
            Ok(sec) => (Some(meta.credential_type), Some(sec)),
            Err(_) => {
                return Err(AppError::VaultError(
                    "Credencial no encontrada en la bóveda. Ingrese la contraseña.".into(),
                ));
            }
        }
    } else {
        (None, None)
    };

    if let (Some(cred_type), Some(secret_payload)) = (credential_type, secret) {
        match cred_type {
            CredentialType::Password => {
                sess.userauth_password(username, secret_payload.expose_secret())
                    .map_err(|e| AppError::SshError(format!("Autenticación por contraseña fallida: {}", e)))?;
            }
            CredentialType::PrivateKey | CredentialType::PassphraseKey => {
                let key_path = Path::new(secret_payload.expose_secret());
                if key_path.exists() {
                    sess.userauth_pubkey_file(username, None, key_path, None)
                        .map_err(|e| AppError::SshError(format!("Autenticación por clave privada fallida: {}", e)))?;
                } else {
                    sess.userauth_password(username, secret_payload.expose_secret())
                        .map_err(|e| AppError::SshError(format!("Autenticación por contraseña fallida: {}", e)))?;
                }
            }
        }
    } else {
        sess.userauth_agent(username).map_err(|e| {
            AppError::SshError(format!("Autenticación SSH fallida (sin credenciales registradas): {}", e))
        })?;
    }

    if !sess.authenticated() {
        return Err(AppError::SshError("Fallo de autenticación SSH".into()));
    }

    let mut channel = sess.channel_session().map_err(|e| {
        AppError::SshError(format!("No se pudo abrir canal de ejecución SSH: {}", e))
    })?;

    let cmd = "uname -srm; echo '---SEP---'; uptime; echo '---SEP---'; free -m 2>/dev/null || cat /proc/meminfo; echo '---SEP---'; df -h / 2>/dev/null; echo '---SEP---'; cat /proc/loadavg 2>/dev/null; echo '---SEP---'; nproc 2>/dev/null || echo 1";
    channel.exec(cmd).map_err(|e| {
        AppError::SshError(format!("Error ejecutando comando de diagnóstico: {}", e))
    })?;

    let mut output = String::new();
    channel.read_to_string(&mut output).map_err(|e| {
        AppError::SshError(format!("Error leyendo respuesta del servidor: {}", e))
    })?;

    let sections: Vec<&str> = output.split("---SEP---").map(|s| s.trim()).collect();

    let os_info = sections.get(0).copied().unwrap_or("Linux").lines().next().unwrap_or("Linux").to_string();
    let uptime_raw = sections.get(1).copied().unwrap_or("").lines().next().unwrap_or("Desconocido").to_string();

    let mem_raw = sections.get(2).copied().unwrap_or("");
    let mut mem_total = 1024u64;
    let mut mem_used = 256u64;
    for line in mem_raw.lines() {
        if line.starts_with("Mem:") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                mem_total = parts[1].parse::<u64>().unwrap_or(1024);
                mem_used = parts[2].parse::<u64>().unwrap_or(256);
            }
            break;
        }
    }
    let mem_percent = if mem_total > 0 {
        ((mem_used as f64 / mem_total as f64) * 100.0).round() as u32
    } else {
        0
    };

    let disk_raw = sections.get(3).copied().unwrap_or("");
    let mut disk_total = "N/A".to_string();
    let mut disk_used = "N/A".to_string();
    let mut disk_percent = "N/A".to_string();
    let disk_lines: Vec<&str> = disk_raw.lines().collect();
    if disk_lines.len() >= 2 {
        let parts: Vec<&str> = disk_lines[1].split_whitespace().collect();
        if parts.len() >= 5 {
            disk_total = parts[1].to_string();
            disk_used = parts[2].to_string();
            disk_percent = parts[4].to_string();
        }
    }

    let load_raw = sections.get(4).copied().unwrap_or("");
    let load_avg = load_raw.lines().next().unwrap_or("0.00, 0.00, 0.00").trim().to_string();

    let ncpu_raw = sections.get(5).copied().unwrap_or("1");
    let cpu_cores = ncpu_raw.lines().next().unwrap_or("1").trim().parse::<u32>().unwrap_or(1);

    Ok(ServerHealthMetrics {
        uptime: uptime_raw,
        load_average: load_avg,
        cpu_cores,
        memory_used_mb: mem_used,
        memory_total_mb: mem_total,
        memory_percent: mem_percent.min(100),
        disk_used,
        disk_total,
        disk_percent,
        os_info,
        ping_ms,
    })
}
