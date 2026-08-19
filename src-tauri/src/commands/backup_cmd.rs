use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::State;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

use crate::core::{ConnectionDto, CredentialMetadataDto, FolderDto, SnippetDto, TagDto};
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::vault::SecretStore;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupCredentialItem {
    pub metadata: CredentialMetadataDto,
    pub secret: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FullBackupPayload {
    pub version: String,
    pub exported_at: String,
    pub folders: Vec<FolderDto>,
    pub tags: Vec<TagDto>,
    pub connections: Vec<ConnectionDto>,
    pub credentials: Vec<BackupCredentialItem>,
    pub snippets: Vec<SnippetDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptedBackupEnvelope {
    pub version: String,
    pub format: String,
    pub salt: String,
    pub nonce: String,
    pub ciphertext: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub folders_imported: usize,
    pub tags_imported: usize,
    pub connections_imported: usize,
    pub credentials_imported: usize,
    pub snippets_imported: usize,
}

#[tauri::command]
pub fn export_backup_data(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    passphrase: Option<String>,
    include_credentials: bool,
) -> Result<String, AppError> {
    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    let folders = Repository::list_folders(&conn)?;
    let tags = Repository::list_tags(&conn)?;
    let connections = Repository::list_connections(&conn)?;
    let snippets = Repository::get_all_snippets(&conn)?;
    let cred_metas = Repository::list_credentials_metadata(&conn)?;

    let mut credentials = Vec::new();
    if include_credentials {
        for meta in cred_metas {
            let secret_val = if let Ok(sec) = vault.get_secret(&meta.id) {
                Some(sec.expose_secret().to_string())
            } else {
                None
            };
            credentials.push(BackupCredentialItem {
                metadata: meta,
                secret: secret_val,
            });
        }
    }

    let payload = FullBackupPayload {
        version: "1.0".to_string(),
        exported_at: chrono::Utc::now().to_rfc3339(),
        folders,
        tags,
        connections,
        credentials,
        snippets,
    };

    let json_str = serde_json::to_string_pretty(&payload)
        .map_err(|e| AppError::ValidationError(format!("Error serializando respaldo: {}", e)))?;

    if let Some(pass) = passphrase {
        if !pass.trim().is_empty() {
            let mut salt = [0u8; 16];
            let mut nonce_bytes = [0u8; 12];
            rand::thread_rng().fill_bytes(&mut salt);
            rand::thread_rng().fill_bytes(&mut nonce_bytes);

            let mut key = [0u8; 32];
            pbkdf2_hmac::<Sha256>(pass.as_bytes(), &salt, 100_000, &mut key);

            let cipher = Aes256Gcm::new_from_slice(&key)
                .map_err(|e| AppError::ValidationError(format!("Error inicializando cifrado: {}", e)))?;
            let nonce = Nonce::from_slice(&nonce_bytes);

            let ciphertext = cipher
                .encrypt(nonce, json_str.as_bytes())
                .map_err(|e| AppError::ValidationError(format!("Error cifrando respaldo: {}", e)))?;

            let envelope = EncryptedBackupEnvelope {
                version: "1.0".to_string(),
                format: "zyntra-encrypted-v1".to_string(),
                salt: BASE64.encode(salt),
                nonce: BASE64.encode(nonce_bytes),
                ciphertext: BASE64.encode(ciphertext),
            };

            return serde_json::to_string_pretty(&envelope)
                .map_err(|e| AppError::ValidationError(format!("Error serializando sobre cifrado: {}", e)));
        }
    }

    Ok(json_str)
}

#[tauri::command]
pub fn import_backup_data(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    raw_data: String,
    passphrase: Option<String>,
) -> Result<ImportSummary, AppError> {
    let raw_trimmed = raw_data.trim();

    let json_content = if let Ok(envelope) = serde_json::from_str::<EncryptedBackupEnvelope>(raw_trimmed) {
        if envelope.format == "zyntra-encrypted-v1" {
            let pass = passphrase.ok_or_else(|| {
                AppError::ValidationError("El archivo de respaldo está protegido con contraseña. Por favor ingrésala para restaurar.".into())
            })?;

            let salt = BASE64.decode(envelope.salt)
                .map_err(|_| AppError::ValidationError("Sal de cifrado corrupta en el archivo".into()))?;
            let nonce_bytes = BASE64.decode(envelope.nonce)
                .map_err(|_| AppError::ValidationError("Nonce corrupto en el archivo".into()))?;
            let ciphertext = BASE64.decode(envelope.ciphertext)
                .map_err(|_| AppError::ValidationError("Contenido cifrado corrupto en el archivo".into()))?;

            let mut key = [0u8; 32];
            pbkdf2_hmac::<Sha256>(pass.as_bytes(), &salt, 100_000, &mut key);

            let cipher = Aes256Gcm::new_from_slice(&key)
                .map_err(|e| AppError::ValidationError(format!("Error inicializando descifrado: {}", e)))?;
            let nonce = Nonce::from_slice(&nonce_bytes);

            let decrypted_bytes = cipher
                .decrypt(nonce, ciphertext.as_ref())
                .map_err(|_| AppError::ValidationError("Contraseña incorrecta o archivo de respaldo dañado.".into()))?;

            String::from_utf8(decrypted_bytes)
                .map_err(|_| AppError::ValidationError("El archivo desencriptado contiene caracteres no válidos.".into()))?
        } else {
            raw_trimmed.to_string()
        }
    } else {
        raw_trimmed.to_string()
    };

    let backup: FullBackupPayload = serde_json::from_str(&json_content)
        .map_err(|e| AppError::ValidationError(format!("Estructura de respaldo inválida: {}", e)))?;

    let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
    let now = chrono::Utc::now().to_rfc3339();

    // Import folders
    let mut folders_count = 0;
    for f in &backup.folders {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO folders (id, name, parent_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![f.id, f.name, f.parent_id, f.created_at, f.updated_at],
        );
        folders_count += 1;
    }

    // Import tags
    let mut tags_count = 0;
    for t in &backup.tags {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
            rusqlite::params![t.id, t.name, t.color],
        );
        tags_count += 1;
    }

    // Import credentials
    let mut creds_count = 0;
    for c in &backup.credentials {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO credentials (id, name, type, provider, username_hint, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                c.metadata.id,
                c.metadata.name,
                c.metadata.credential_type.as_str(),
                c.metadata.provider,
                c.metadata.username_hint,
                c.metadata.created_at,
                c.metadata.updated_at,
            ],
        );
        if let Some(secret_str) = &c.secret {
            let _ = vault.store_secret(&c.metadata.id, secret_str);
        }
        creds_count += 1;
    }

    // Import connections
    let mut conns_count = 0;
    for conn_item in &backup.connections {
        let _ = conn.execute(
            "INSERT OR REPLACE INTO connections (id, name, protocol, host, port, username, credential_id, folder_id, favorite, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![
                conn_item.id,
                conn_item.name,
                conn_item.protocol.as_str(),
                conn_item.host,
                conn_item.port,
                conn_item.username,
                conn_item.credential_id,
                conn_item.folder_id,
                if conn_item.favorite { 1 } else { 0 },
                conn_item.created_at,
                now,
            ],
        );

        // Associate tags
        for t in &conn_item.tags {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO connection_tags (connection_id, tag_id) VALUES (?1, ?2)",
                rusqlite::params![conn_item.id, t.id],
            );
        }

        conns_count += 1;
    }

    // Import snippets
    let mut snippets_count = 0;
    for s in &backup.snippets {
        let _ = conn.execute(
            "INSERT OR REPLACE INTO snippets (id, name, command, category, description, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![s.id, s.name, s.command, s.category, s.description, s.created_at],
        );
        snippets_count += 1;
    }

    Ok(ImportSummary {
        folders_imported: folders_count,
        tags_imported: tags_count,
        connections_imported: conns_count,
        credentials_imported: creds_count,
        snippets_imported: snippets_count,
    })
}
