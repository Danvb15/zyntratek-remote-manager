use std::sync::Arc;
use tauri::{ipc::Channel, State};

use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::protocols::ssh::session::SshEvent;
use crate::protocols::SshSessionManager;
use crate::vault::SecretStore;

use crate::core::CredentialType;
use crate::vault::SecretPayload;

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


    // 3. Start SSH session via SshSessionManager
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
