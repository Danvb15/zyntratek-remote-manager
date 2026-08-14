use std::sync::Arc;
use tauri::State;

use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::protocols::rdp::session::RdpSessionDto;
use crate::protocols::RdpSessionManager;
use crate::vault::SecretStore;

#[tauri::command]
pub async fn start_rdp_session(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    rdp_manager: State<'_, Arc<RdpSessionManager>>,
    connection_id: String,
) -> Result<String, AppError> {
    // 1. Get Connection metadata from SQLite
    let connection = {
        let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
        Repository::get_connection(&conn, &connection_id)?
    };

    if connection.protocol != crate::core::Protocol::RDP {
        return Err(AppError::ValidationError("La conexión no es de protocolo RDP".into()));
    }

    // 2. Fetch credential metadata and secret from OS Keyring (if attached)
    let secret = if let Some(cred_id) = &connection.credential_id {
        vault.get_secret(cred_id).ok()
    } else {
        None
    };

    // Extract domain if username contains 'domain\user' or 'user@domain'
    let (domain, clean_username) = if connection.username.contains('\\') {
        let parts: Vec<&str> = connection.username.splitn(2, '\\').collect();
        (Some(parts[0].to_string()), parts[1].to_string())
    } else {
        (None, connection.username)
    };

    // 3. Start RDP session via RdpSessionManager
    rdp_manager
        .start_session(
            connection_id,
            connection.host,
            connection.port,
            clean_username,
            domain,
            secret,
            false,
        )
        .await
}

#[tauri::command]
pub fn list_rdp_sessions(
    rdp_manager: State<'_, Arc<RdpSessionManager>>,
) -> Result<Vec<RdpSessionDto>, AppError> {
    rdp_manager.list_sessions()
}

#[tauri::command]
pub fn disconnect_rdp_session(
    rdp_manager: State<'_, Arc<RdpSessionManager>>,
    session_id: String,
) -> Result<(), AppError> {
    rdp_manager.disconnect(&session_id)
}
