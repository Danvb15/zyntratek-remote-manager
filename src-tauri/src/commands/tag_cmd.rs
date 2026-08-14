use tauri::State;

use crate::core::TagDto;
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn create_tag(
    db: State<'_, DbState>,
    name: String,
    color: Option<String>,
) -> Result<TagDto, AppError> {
    if name.trim().is_empty() {
        return Err(AppError::ValidationError("Tag name cannot be empty".into()));
    }
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::create_tag(&conn, &name, color.as_deref())
}

#[tauri::command]
pub fn list_tags(
    db: State<'_, DbState>,
) -> Result<Vec<TagDto>, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::list_tags(&conn)
}

#[tauri::command]
pub fn delete_tag(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::delete_tag(&conn, &id)
}
