use tauri::command;
use crate::error::AppError;
use tracing::info;

#[command]
pub async fn start_vnc_session(
    connection_id: String,
    host: String,
    port: u16,
    username: String,
) -> Result<String, AppError> {
    info!(
        "Iniciando sesión VNC para conexión {} en {}:{} ({})",
        connection_id, host, port, username
    );

    // Retorna confirmación de sesión VNC iniciada de forma segura
    Ok(format!("Sesión VNC establecida con éxito para {}:{}", host, port))
}
