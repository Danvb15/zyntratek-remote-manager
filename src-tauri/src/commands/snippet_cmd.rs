use tauri::{command, State};
use crate::core::{CreateSnippetPayload, SnippetDto, UpdateSnippetPayload};
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;

#[command]
pub fn create_snippet(
    db: State<'_, DbState>,
    payload: CreateSnippetPayload,
) -> Result<SnippetDto, AppError> {
    let conn = db.conn.lock().unwrap();
    Repository::create_snippet(&conn, &payload)
}

#[command]
pub fn get_all_snippets(
    db: State<'_, DbState>,
) -> Result<Vec<SnippetDto>, AppError> {
    let conn = db.conn.lock().unwrap();
    Repository::get_all_snippets(&conn)
}

#[command]
pub fn update_snippet(
    db: State<'_, DbState>,
    id: String,
    payload: UpdateSnippetPayload,
) -> Result<SnippetDto, AppError> {
    let conn = db.conn.lock().unwrap();
    Repository::update_snippet(&conn, &id, &payload)
}

#[command]
pub fn delete_snippet(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    Repository::delete_snippet(&conn, &id)
}
