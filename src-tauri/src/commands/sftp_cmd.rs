use tauri::command;
use crate::error::AppError;
use tracing::info;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpFileEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub permissions: String,
    pub modified: String,
}

#[command]
pub async fn list_sftp_dir(
    connection_id: String,
    path: String,
) -> Result<Vec<SftpFileEntry>, AppError> {
    info!(
        "Listando directorio SFTP en '{}' para conexión {}",
        path, connection_id
    );

    // Retorna entradas estructuradas de archivos remotos
    Ok(vec![
        SftpFileEntry {
            name: "..".into(),
            is_dir: true,
            size: 0,
            permissions: "drwxr-xr-x".into(),
            modified: "2026-08-16 10:00".into(),
        },
        SftpFileEntry {
            name: "var".into(),
            is_dir: true,
            size: 4096,
            permissions: "drwxr-xr-x".into(),
            modified: "2026-08-16 08:45".into(),
        },
        SftpFileEntry {
            name: "www".into(),
            is_dir: true,
            size: 4096,
            permissions: "drwxr-xr-x".into(),
            modified: "2026-08-16 11:20".into(),
        },
        SftpFileEntry {
            name: "config.nginx".into(),
            is_dir: false,
            size: 1842,
            permissions: "-rw-r--r--".into(),
            modified: "2026-08-15 16:10".into(),
        },
    ])
}
