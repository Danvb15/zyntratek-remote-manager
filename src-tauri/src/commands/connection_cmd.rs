use tauri::State;

use crate::core::{ConnectionDto, CreateConnectionPayload, UpdateConnectionPayload};
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn create_connection(
    db: State<'_, DbState>,
    payload: CreateConnectionPayload,
) -> Result<ConnectionDto, AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::ValidationError("Connection name cannot be empty".into()));
    }
    if payload.host.trim().is_empty() {
        return Err(AppError::ValidationError("Host cannot be empty".into()));
    }
    if payload.port == 0 {
        return Err(AppError::ValidationError("Invalid port number".into()));
    }

    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::create_connection(&conn, &payload)
}

#[tauri::command]
pub fn get_connection(
    db: State<'_, DbState>,
    id: String,
) -> Result<ConnectionDto, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::get_connection(&conn, &id)
}

#[tauri::command]
pub fn list_connections(
    db: State<'_, DbState>,
) -> Result<Vec<ConnectionDto>, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::list_connections(&conn)
}

#[tauri::command]
pub fn update_connection(
    db: State<'_, DbState>,
    id: String,
    payload: UpdateConnectionPayload,
) -> Result<ConnectionDto, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::update_connection(&conn, &id, &payload)
}

#[tauri::command]
pub fn delete_connection(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::delete_connection(&conn, &id)
}

#[tauri::command]
pub fn duplicate_connection(
    db: State<'_, DbState>,
    id: String,
) -> Result<ConnectionDto, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::duplicate_connection(&conn, &id)
}
