use std::fs::File as LocalFile;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::Path;
use std::sync::Arc;
use tauri::{command, State};
use tracing::info;
use serde::{Deserialize, Serialize};
use ssh2::Session;

use crate::core::CredentialType;
use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;
use crate::vault::{SecretPayload, SecretStore};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpFileEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub permissions: String,
    pub modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SftpDirResult {
    pub current_path: String,
    pub entries: Vec<SftpFileEntry>,
}

fn connect_sftp_session(
    db: &State<'_, DbState>,
    vault: &State<'_, Arc<dyn SecretStore>>,
    connection_id: &str,
    manual_password: Option<String>,
) -> Result<ssh2::Sftp, AppError> {
    // 1. Obtener metadatos de conexión desde la base de datos SQLite
    let connection = {
        let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
        Repository::get_connection(&conn, connection_id)?
    };

    let host = &connection.host;
    let port = connection.port;
    let username = &connection.username;

    info!("Conectando TCP SFTP a {}:{}", host, port);

    // 2. Conectar socket TCP
    let tcp = TcpStream::connect((host.as_str(), port)).map_err(|e| {
        AppError::SshError(format!("No se pudo conectar al puerto SFTP {}:{}: {}", host, port, e))
    })?;

    // 3. Crear sesión SSH2
    let mut sess = Session::new().map_err(|e| {
        AppError::SshError(format!("Error inicializando sesión SSH2: {}", e))
    })?;

    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| {
        AppError::SshError(format!("Falló el Handshake SSH con {}: {}", host, e))
    })?;

    // 4. Resolver credencial desde Keyring / Bóveda o contraseña manual
    let (credential_type, secret) = if let Some(pass) = manual_password {
        if !pass.trim().is_empty() {
            (
                Some(CredentialType::Password),
                Some(SecretPayload::new(pass)),
            )
        } else {
            (None, None)
        }
    } else if let Some(cred_id) = &connection.credential_id {
        let meta = {
            let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
            Repository::get_credential_metadata(&conn, cred_id)?
        };
        match vault.get_secret(cred_id) {
            Ok(sec) => (Some(meta.credential_type), Some(sec)),
            Err(_) => {
                return Err(AppError::VaultError(
                    "Credencial no encontrada en el almacén seguro. Ingrese la contraseña.".into(),
                ));
            }
        }
    } else {
        (None, None)
    };

    // 5. Autenticar
    if let (Some(cred_type), Some(secret_payload)) = (credential_type, secret) {
        match cred_type {
            CredentialType::Password => {
                sess.userauth_password(username, secret_payload.expose_secret())
                    .map_err(|e| {
                        AppError::SshError(format!(
                            "Autenticación SFTP por contraseña fallida para '{}': {}",
                            username, e
                        ))
                    })?;
            }
            CredentialType::PrivateKey | CredentialType::PassphraseKey => {
                let key_path = Path::new(secret_payload.expose_secret());
                if key_path.exists() {
                    sess.userauth_pubkey_file(username, None, key_path, None)
                        .map_err(|e| {
                            AppError::SshError(format!(
                                "Autenticación SFTP por clave privada fallida para '{}': {}",
                                username, e
                            ))
                        })?;
                } else {
                    sess.userauth_password(username, secret_payload.expose_secret())
                        .map_err(|e| {
                            AppError::SshError(format!(
                                "Autenticación SFTP fallida para '{}': {}",
                                username, e
                            ))
                        })?;
                }
            }
        }
    } else {
        return Err(AppError::SshError(
            "Se requiere contraseña o clave privada para autenticar en el servidor SFTP.".into(),
        ));
    }

    if !sess.authenticated() {
        return Err(AppError::SshError(
            "Autenticación SFTP no completada.".into(),
        ));
    }

    // 6. Iniciar canal SFTP
    let sftp = sess.sftp().map_err(|e| {
        AppError::SshError(format!("No se pudo abrir el canal SFTP en el servidor: {}", e))
    })?;

    Ok(sftp)
}

#[command]
pub async fn list_sftp_dir(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    path: String,
    manual_password: Option<String>,
) -> Result<SftpDirResult, AppError> {
    info!("Listando directorio SFTP real en '{}'", path);
    let sftp = connect_sftp_session(&db, &vault, &connection_id, manual_password)?;

    let target_path = if path.trim().is_empty() { "." } else { &path };

    let resolved_path = sftp
        .realpath(Path::new(target_path))
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| target_path.to_string());

    let dir_entries = sftp.readdir(Path::new(target_path)).map_err(|e| {
        AppError::SshError(format!("Error leyendo directorio remoto '{}': {}", target_path, e))
    })?;

    let mut entries = Vec::new();

    // Añadir entrada '..' si no es la raíz '/'
    if resolved_path != "/" && target_path != "/" {
        entries.push(SftpFileEntry {
            name: "..".into(),
            is_dir: true,
            size: 0,
            permissions: "drwxr-xr-x".into(),
            modified: "".into(),
        });
    }

    for (p, stat) in dir_entries {
        if let Some(file_name) = p.file_name() {
            let name_str = file_name.to_string_lossy().to_string();
            if name_str == "." || name_str == ".." {
                continue;
            }

            let permissions = format_mode(stat.perm.unwrap_or(0));
            let is_dir = stat.is_dir() || permissions.starts_with('d');
            let size = stat.size.unwrap_or(0);
            let modified = stat
                .mtime
                .map(|t| chrono::DateTime::from_timestamp(t as i64, 0).map(|dt| dt.format("%Y-%m-%d %H:%M").to_string()).unwrap_or_default())
                .unwrap_or_default();

            entries.push(SftpFileEntry {
                name: name_str,
                is_dir,
                size,
                permissions,
                modified,
            });
        }
    }

    // Ordenar: Directorios primero, luego archivos
    entries.sort_by(|a, b| {
        if a.name == ".." {
            return std::cmp::Ordering::Less;
        }
        if b.name == ".." {
            return std::cmp::Ordering::Greater;
        }
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(SftpDirResult {
        current_path: resolved_path,
        entries,
    })
}

#[command]

pub async fn create_sftp_dir(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    path: String,
    manual_password: Option<String>,
) -> Result<(), AppError> {
    info!("Creando carpeta remota SFTP en '{}'", path);
    let sftp = connect_sftp_session(&db, &vault, &connection_id, manual_password)?;
    sftp.mkdir(Path::new(&path), 0o755).map_err(|e| {
        AppError::SshError(format!("Error creando carpeta remota '{}': {}", path, e))
    })?;
    Ok(())
}

#[command]
pub async fn delete_sftp_item(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    path: String,
    is_dir: bool,
    manual_password: Option<String>,
) -> Result<(), AppError> {
    info!("Eliminando elemento remoto SFTP en '{}'", path);
    let sftp = connect_sftp_session(&db, &vault, &connection_id, manual_password)?;
    if is_dir {
        sftp.rmdir(Path::new(&path)).map_err(|e| {
            AppError::SshError(format!("Error eliminando directorio remoto '{}': {}", path, e))
        })?;
    } else {
        sftp.unlink(Path::new(&path)).map_err(|e| {
            AppError::SshError(format!("Error eliminando archivo remoto '{}': {}", path, e))
        })?;
    }
    Ok(())
}

#[command]
pub async fn upload_sftp_file(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    remote_path: String,
    local_file_path: String,
    manual_password: Option<String>,
) -> Result<(), AppError> {
    info!("Subiendo archivo local '{}' a remoto SFTP '{}'", local_file_path, remote_path);
    let sftp = connect_sftp_session(&db, &vault, &connection_id, manual_password)?;

    let mut local_file = LocalFile::open(&local_file_path).map_err(|e| {
        AppError::SshError(format!("No se pudo abrir el archivo local '{}': {}", local_file_path, e))
    })?;

    let mut remote_file = sftp.create(Path::new(&remote_path)).map_err(|e| {
        AppError::SshError(format!("No se pudo crear el archivo remoto '{}': {}", remote_path, e))
    })?;

    let mut buffer = [0u8; 16384];
    loop {
        let bytes_read = local_file.read(&mut buffer).map_err(|e| {
            AppError::SshError(format!("Error leyendo datos del archivo local: {}", e))
        })?;
        if bytes_read == 0 {
            break;
        }
        remote_file.write_all(&buffer[..bytes_read]).map_err(|e| {
            AppError::SshError(format!("Error escribiendo datos al archivo remoto: {}", e))
        })?;
    }

    Ok(())
}

#[command]
pub async fn download_sftp_file(
    db: State<'_, DbState>,
    vault: State<'_, Arc<dyn SecretStore>>,
    connection_id: String,
    remote_file_path: String,
    local_destination_path: String,
    manual_password: Option<String>,
) -> Result<(), AppError> {
    info!("Descargando archivo remoto SFTP '{}' a local '{}'", remote_file_path, local_destination_path);
    let sftp = connect_sftp_session(&db, &vault, &connection_id, manual_password)?;

    let mut remote_file = sftp.open(Path::new(&remote_file_path)).map_err(|e| {
        AppError::SshError(format!("No se pudo abrir el archivo remoto '{}': {}", remote_file_path, e))
    })?;

    let mut local_file = LocalFile::create(&local_destination_path).map_err(|e| {
        AppError::SshError(format!("No se pudo crear el archivo local de destino '{}': {}", local_destination_path, e))
    })?;

    let mut buffer = [0u8; 16384];
    loop {
        let bytes_read = remote_file.read(&mut buffer).map_err(|e| {
            AppError::SshError(format!("Error leyendo datos del archivo remoto: {}", e))
        })?;
        if bytes_read == 0 {
            break;
        }
        local_file.write_all(&buffer[..bytes_read]).map_err(|e| {
            AppError::SshError(format!("Error escribiendo datos al archivo local: {}", e))
        })?;
    }

    Ok(())
}

fn format_mode(mode: u32) -> String {

    let is_dir = (mode & 0o040000) != 0;
    let user_r = if (mode & 0o400) != 0 { 'r' } else { '-' };
    let user_w = if (mode & 0o200) != 0 { 'w' } else { '-' };
    let user_x = if (mode & 0o100) != 0 { 'x' } else { '-' };

    let group_r = if (mode & 0o040) != 0 { 'r' } else { '-' };
    let group_w = if (mode & 0o020) != 0 { 'w' } else { '-' };
    let group_x = if (mode & 0o010) != 0 { 'x' } else { '-' };

    let other_r = if (mode & 0o004) != 0 { 'r' } else { '-' };
    let other_w = if (mode & 0o002) != 0 { 'w' } else { '-' };
    let other_x = if (mode & 0o001) != 0 { 'x' } else { '-' };

    format!(
        "{}{}{}{}{}{}{}{}{}{}",
        if is_dir { 'd' } else { '-' },
        user_r,
        user_w,
        user_x,
        group_r,
        group_w,
        group_x,
        other_r,
        other_w,
        other_x
    )
}
