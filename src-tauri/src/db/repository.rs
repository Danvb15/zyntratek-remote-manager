use std::str::FromStr;
use chrono::Utc;
use rusqlite::{params, Connection as SqliteConnection};
use uuid::Uuid;


use crate::core::{
    ConnectionDto, CreateConnectionPayload, CreateCredentialPayload, CredentialMetadataDto,
    CredentialType, FolderDto, Protocol, TagDto, UpdateConnectionPayload, UpdateCredentialPayload,
};
use crate::error::AppError;

pub struct Repository;

impl Repository {
    // --- CREDENTIAL METADATA OPERATIONS ---

    pub fn create_credential_metadata(
        conn: &SqliteConnection,
        id: &str,
        payload: &CreateCredentialPayload,
    ) -> Result<CredentialMetadataDto, AppError> {
        if payload.name.trim().is_empty() {
            return Err(AppError::ValidationError("El nombre de la credencial no puede estar vacío".into()));
        }

        let now = Utc::now().to_rfc3339();

        let provider = "OSKeyring";

        conn.execute(
            "INSERT INTO credentials (id, name, type, provider, username_hint, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                payload.name,
                payload.credential_type.as_str(),
                provider,
                payload.username_hint,
                now,
                now
            ],
        )?;

        Ok(CredentialMetadataDto {
            id: id.to_string(),
            name: payload.name.clone(),
            credential_type: payload.credential_type.clone(),
            provider: provider.to_string(),
            username_hint: payload.username_hint.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_credential_metadata(
        conn: &SqliteConnection,
        id: &str,
    ) -> Result<CredentialMetadataDto, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, name, type, provider, username_hint, created_at, updated_at
             FROM credentials WHERE id = ?1",
        )?;

        let cred = stmt.query_row(params![id], |row| {
            let type_str: String = row.get(2)?;
            Ok(CredentialMetadataDto {
                id: row.get(0)?,
                name: row.get(1)?,
                credential_type: CredentialType::from_str(&type_str).unwrap_or(CredentialType::Password),
                provider: row.get(3)?,
                username_hint: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Credential metadata for id {} not found", id)),
            other => AppError::DatabaseError(other.to_string()),
        })?;

        Ok(cred)
    }

    pub fn list_credentials_metadata(
        conn: &SqliteConnection,
    ) -> Result<Vec<CredentialMetadataDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, name, type, provider, username_hint, created_at, updated_at
             FROM credentials ORDER BY name ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            let type_str: String = row.get(2)?;
            Ok(CredentialMetadataDto {
                id: row.get(0)?,
                name: row.get(1)?,
                credential_type: CredentialType::from_str(&type_str).unwrap_or(CredentialType::Password),
                provider: row.get(3)?,
                username_hint: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut result = Vec::new();
        for item in rows {
            result.push(item?);
        }
        Ok(result)
    }

    pub fn update_credential_metadata(
        conn: &SqliteConnection,
        id: &str,
        payload: &UpdateCredentialPayload,
    ) -> Result<CredentialMetadataDto, AppError> {
        let current = Self::get_credential_metadata(conn, id)?;
        let now = Utc::now().to_rfc3339();

        let name = payload.name.clone().unwrap_or(current.name);
        let cred_type = payload.credential_type.clone().unwrap_or(current.credential_type);
        let username_hint = payload.username_hint.clone().or(current.username_hint);

        conn.execute(
            "UPDATE credentials SET name = ?1, type = ?2, username_hint = ?3, updated_at = ?4 WHERE id = ?5",
            params![name, cred_type.as_str(), username_hint, now, id],
        )?;

        Self::get_credential_metadata(conn, id)
    }

    pub fn delete_credential_metadata(conn: &SqliteConnection, id: &str) -> Result<(), AppError> {
        let affected = conn.execute("DELETE FROM credentials WHERE id = ?1", params![id])?;
        if affected == 0 {
            Err(AppError::NotFound(format!("Credential with id {} not found", id)))
        } else {
            Ok(())
        }
    }

    // --- CONNECTION OPERATIONS ---

    pub fn create_connection(
        conn: &SqliteConnection,
        payload: &CreateConnectionPayload,
    ) -> Result<ConnectionDto, AppError> {
        if payload.name.trim().is_empty() {
            return Err(AppError::ValidationError("El nombre de la conexión no puede estar vacío".into()));
        }
        if payload.host.trim().is_empty() {
            return Err(AppError::ValidationError("El host no puede estar vacío".into()));
        }
        if payload.port == 0 {
            return Err(AppError::ValidationError("El puerto debe ser un número entero entre 1 y 65535".into()));
        }
        if payload.username.trim().is_empty() {
            return Err(AppError::ValidationError("El usuario no puede estar vacío".into()));
        }

        let id = Uuid::new_v4().to_string();

        let now = Utc::now().to_rfc3339();
        let favorite = payload.favorite.unwrap_or(false);

        conn.execute(
            "INSERT INTO connections (id, name, protocol, host, port, username, credential_id, folder_id, favorite, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                id,
                payload.name,
                payload.protocol.as_str(),
                payload.host,
                payload.port,
                payload.username,
                payload.credential_id,
                payload.folder_id,
                if favorite { 1 } else { 0 },
                now,
                now
            ],
        )?;

        if let Some(tag_ids) = &payload.tag_ids {
            for tag_id in tag_ids {
                conn.execute(
                    "INSERT INTO connection_tags (connection_id, tag_id) VALUES (?1, ?2)",
                    params![id, tag_id],
                )?;
            }
        }

        Self::get_connection(conn, &id)
    }

    pub fn get_connection(conn: &SqliteConnection, id: &str) -> Result<ConnectionDto, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, name, protocol, host, port, username, credential_id, folder_id, favorite, created_at, updated_at
             FROM connections WHERE id = ?1",
        )?;

        let mut connection = stmt.query_row(params![id], |row| {
            let protocol_str: String = row.get(2)?;
            let favorite_int: i32 = row.get(8)?;
            Ok(ConnectionDto {
                id: row.get(0)?,
                name: row.get(1)?,
                protocol: Protocol::from_str(&protocol_str).unwrap_or(Protocol::SSH),
                host: row.get(3)?,
                port: row.get(4)?,
                username: row.get(5)?,
                credential_id: row.get(6)?,
                folder_id: row.get(7)?,
                favorite: favorite_int != 0,
                tags: Vec::new(),
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Connection with id {} not found", id)),
            other => AppError::DatabaseError(other.to_string()),
        })?;

        // Fetch attached tags
        connection.tags = Self::get_connection_tags(conn, id)?;
        Ok(connection)
    }

    pub fn list_connections(conn: &SqliteConnection) -> Result<Vec<ConnectionDto>, AppError> {
        let mut stmt = conn.prepare("SELECT id FROM connections ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;

        let mut list = Vec::new();
        for row in rows {
            let id = row?;
            list.push(Self::get_connection(conn, &id)?);
        }
        Ok(list)
    }

    pub fn update_connection(
        conn: &SqliteConnection,
        id: &str,
        payload: &UpdateConnectionPayload,
    ) -> Result<ConnectionDto, AppError> {
        let current = Self::get_connection(conn, id)?;
        let now = Utc::now().to_rfc3339();

        let name = payload.name.clone().unwrap_or(current.name);
        let protocol = payload.protocol.clone().unwrap_or(current.protocol);
        let host = payload.host.clone().unwrap_or(current.host);
        let port = payload.port.unwrap_or(current.port);
        let username = payload.username.clone().unwrap_or(current.username);
        let credential_id = payload.credential_id.clone().or(current.credential_id);
        let folder_id = payload.folder_id.clone().or(current.folder_id);
        let favorite = payload.favorite.unwrap_or(current.favorite);

        conn.execute(
            "UPDATE connections SET name = ?1, protocol = ?2, host = ?3, port = ?4, username = ?5,
             credential_id = ?6, folder_id = ?7, favorite = ?8, updated_at = ?9 WHERE id = ?10",
            params![
                name,
                protocol.as_str(),
                host,
                port,
                username,
                credential_id,
                folder_id,
                if favorite { 1 } else { 0 },
                now,
                id
            ],
        )?;

        if let Some(tag_ids) = &payload.tag_ids {
            conn.execute("DELETE FROM connection_tags WHERE connection_id = ?1", params![id])?;
            for tag_id in tag_ids {
                conn.execute(
                    "INSERT INTO connection_tags (connection_id, tag_id) VALUES (?1, ?2)",
                    params![id, tag_id],
                )?;
            }
        }

        Self::get_connection(conn, id)
    }

    pub fn delete_connection(conn: &SqliteConnection, id: &str) -> Result<(), AppError> {
        let affected = conn.execute("DELETE FROM connections WHERE id = ?1", params![id])?;
        if affected == 0 {
            Err(AppError::NotFound(format!("Connection with id {} not found", id)))
        } else {
            Ok(())
        }
    }

    pub fn duplicate_connection(conn: &SqliteConnection, id: &str) -> Result<ConnectionDto, AppError> {
        let existing = Self::get_connection(conn, id)?;
        let tag_ids: Vec<String> = existing.tags.iter().map(|t| t.id.clone()).collect();

        let payload = CreateConnectionPayload {
            name: format!("{} (Copy)", existing.name),
            protocol: existing.protocol,
            host: existing.host,
            port: existing.port,
            username: existing.username,
            credential_id: existing.credential_id,
            folder_id: existing.folder_id,
            favorite: Some(existing.favorite),
            tag_ids: Some(tag_ids),
        };

        Self::create_connection(conn, &payload)
    }

    // --- FOLDERS & TAGS HELPERS ---

    pub fn create_folder(conn: &SqliteConnection, name: &str, parent_id: Option<&str>) -> Result<FolderDto, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO folders (id, name, parent_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, parent_id, now, now],
        )?;

        Ok(FolderDto {
            id,
            name: name.to_string(),
            parent_id: parent_id.map(|s| s.to_string()),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_folders(conn: &SqliteConnection) -> Result<Vec<FolderDto>, AppError> {
        let mut stmt = conn.prepare("SELECT id, name, parent_id, created_at, updated_at FROM folders ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(FolderDto {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        let mut folders = Vec::new();
        for r in rows {
            folders.push(r?);
        }
        Ok(folders)
    }

    pub fn delete_folder(conn: &SqliteConnection, id: &str) -> Result<(), AppError> {
        let affected = conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        if affected == 0 {
            Err(AppError::NotFound(format!("Folder with id {} not found", id)))
        } else {
            Ok(())
        }
    }

    pub fn create_tag(conn: &SqliteConnection, name: &str, color: Option<&str>) -> Result<TagDto, AppError> {
        let id = Uuid::new_v4().to_string();
        let color_val = color.unwrap_or("#64748b");

        conn.execute(
            "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
            params![id, name, color_val],
        )?;

        Ok(TagDto {
            id,
            name: name.to_string(),
            color: color_val.to_string(),
        })
    }

    pub fn list_tags(conn: &SqliteConnection) -> Result<Vec<TagDto>, AppError> {
        let mut stmt = conn.prepare("SELECT id, name, color FROM tags ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(TagDto {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?;

        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }

    pub fn delete_tag(conn: &SqliteConnection, id: &str) -> Result<(), AppError> {
        let affected = conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
        if affected == 0 {
            Err(AppError::NotFound(format!("Tag with id {} not found", id)))
        } else {
            Ok(())
        }
    }

    fn get_connection_tags(conn: &SqliteConnection, connection_id: &str) -> Result<Vec<TagDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name, t.color
             FROM tags t
             JOIN connection_tags ct ON t.id = ct.tag_id
             WHERE ct.connection_id = ?1",
        )?;

        let rows = stmt.query_map(params![connection_id], |row| {
            Ok(TagDto {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?;

        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }
}

