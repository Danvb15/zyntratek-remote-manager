pub mod connection_cmd;
pub mod credential_cmd;
pub mod folder_cmd;
pub mod rdp_cmd;
pub mod ssh_cmd;
pub mod tag_cmd;
pub mod web_cmd;


use crate::error::AppError;

#[tauri::command]
pub fn ping() -> Result<String, AppError> {
    Ok("pong".into())
}
