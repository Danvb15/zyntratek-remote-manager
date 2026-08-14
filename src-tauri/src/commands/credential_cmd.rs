use tauri::State;
use uuid::Uuid;

use crate::core::{CreateCredentialPayload, CredentialMetadataDto, UpdateCredentialPayload};
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::vault::SecretStore;

#[tauri::command]
pub fn create_credential(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    payload: CreateCredentialPayload,
) -> Result<CredentialMetadataDto, AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::ValidationError("Credential name cannot be empty".into()));
    }

    let credential_id = Uuid::new_v4().to_string();

    // 1. Store secret directly into OS Keyring / Vault
    vault.store_secret(&credential_id, &payload.secret)?;

    // 2. Store ONLY metadata in SQLite
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    let metadata = Repository::create_credential_metadata(&conn, &credential_id, &payload)?;

    Ok(metadata)
}

#[tauri::command]
pub fn update_credential(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    id: String,
    payload: UpdateCredentialPayload,
) -> Result<CredentialMetadataDto, AppError> {
    // If secret payload is provided, update OS Keyring first
    if let Some(secret) = &payload.secret {
        vault.store_secret(&id, secret)?;
    }

    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::update_credential_metadata(&conn, &id, &payload)
}

#[tauri::command]
pub fn delete_credential(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    id: String,
) -> Result<(), AppError> {
    // Delete secret from OS Keyring
    let _ = vault.delete_secret(&id);

    // Delete metadata from SQLite
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::delete_credential_metadata(&conn, &id)
}

#[tauri::command]
pub fn list_credentials_metadata(
    db: State<'_, DbState>,
) -> Result<Vec<CredentialMetadataDto>, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    Repository::list_credentials_metadata(&conn)
}

use std::sync::Arc;
