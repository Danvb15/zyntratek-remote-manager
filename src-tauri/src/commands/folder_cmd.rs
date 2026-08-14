use tauri::State;

use crate::core::FolderDto;
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn create_folder(
    db: State<'_, DbState>,
    name: String,
    parent_id: Option<String>,
) -> Result<FolderDto, AppError> {
    if name.trim().is_empty() {
        return Err(AppError::ValidationError("Folder name cannot be empty".into()));
    }
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::create_folder(&conn, &name, parent_id.as_deref())
}

#[tauri::command]
pub fn list_folders(
    db: State<'_, DbState>,
) -> Result<Vec<FolderDto>, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::list_folders(&conn)
}

#[tauri::command]
pub fn delete_folder(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::delete_folder(&conn, &id)
}
