pub mod commands;
pub mod core;
pub mod db;
pub mod error;
pub mod protocols;
pub mod vault;

use std::sync::Arc;
use db::DbState;
use protocols::{RdpSessionManager, SshSessionManager};
use vault::{HybridVaultStore, SecretStore};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_dir = dirs::data_dir()
        .map(|d| d.join("zyntratek-remote-manager"))
        .unwrap_or_else(|| std::path::PathBuf::from("."));

    let _ = std::fs::create_dir_all(&app_dir);
    let db_path = app_dir.join("zyntratek.db");

    let db_state = DbState::new_file_db(db_path.to_str().unwrap())
        .expect("Failed to initialize SQLite database");

    let vault_store: Arc<dyn SecretStore> = Arc::new(vault::HybridVaultStore::new(app_dir.clone()));

    let ssh_manager = Arc::new(SshSessionManager::new(app_dir.clone()));
    let rdp_manager = Arc::new(RdpSessionManager::new());

    tauri::Builder::default()
        .manage(db_state)
        .manage(vault_store)
        .manage(ssh_manager)
        .manage(rdp_manager)
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::credential_cmd::create_credential,
            commands::credential_cmd::update_credential,
            commands::credential_cmd::delete_credential,
            commands::credential_cmd::list_credentials_metadata,
            commands::connection_cmd::create_connection,
            commands::connection_cmd::get_connection,
            commands::connection_cmd::list_connections,
            commands::connection_cmd::update_connection,
            commands::connection_cmd::delete_connection,
            commands::connection_cmd::duplicate_connection,
            commands::folder_cmd::create_folder,
            commands::folder_cmd::list_folders,
            commands::folder_cmd::delete_folder,
            commands::tag_cmd::create_tag,
            commands::tag_cmd::list_tags,
            commands::tag_cmd::delete_tag,
            commands::ssh_cmd::start_ssh_session,
            commands::ssh_cmd::send_ssh_input,
            commands::ssh_cmd::resize_ssh_pty,
            commands::ssh_cmd::disconnect_ssh_session,
            commands::ssh_cmd::trust_ssh_host,
            commands::rdp_cmd::start_rdp_session,
            commands::rdp_cmd::list_rdp_sessions,
            commands::rdp_cmd::disconnect_rdp_session,
            commands::web_cmd::open_web_console_window,
            commands::vnc_cmd::start_vnc_session,
            commands::sftp_cmd::list_sftp_dir,
            commands::sftp_cmd::create_sftp_dir,
            commands::sftp_cmd::delete_sftp_item,
            commands::sftp_cmd::upload_sftp_file,
            commands::sftp_cmd::download_sftp_file,
        ])




        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
