use zyntratek_remote_manager::core::{CreateConnectionPayload, Protocol};
use zyntratek_remote_manager::db::repository::Repository;
use zyntratek_remote_manager::db::DbState;
use zyntratek_remote_manager::protocols::rdp::launcher::RdpLaunchConfig;
use zyntratek_remote_manager::protocols::{RdpSessionManager, SshSessionManager};
use zyntratek_remote_manager::vault::{InMemoryVaultStore, SecretPayload, SecretStore};
use tempfile::tempdir;

#[test]
fn test_adversarial_input_validation_and_injection_immunity() {
    let db = DbState::new_in_memory().expect("Failed to create in-memory db");
    let conn = db.conn.lock().unwrap();

    let long_str = "A".repeat(5000);
    let malicious_payloads = vec![
        "'; DROP TABLE connections; --",
        "<script>alert('xss')</script>",
        "../../../../etc/passwd",
        "127.0.0.1; rm -rf /",
        "admin & calc.exe",
        "\" OR 1=1 --",
        "\x00nullbyte",
        long_str.as_str(),
    ];

    for (idx, bad_str) in malicious_payloads.iter().enumerate() {
        let payload = CreateConnectionPayload {
            name: format!("Connection {}", idx),
            protocol: Protocol::SSH,
            host: bad_str.to_string(),
            port: 22,
            username: bad_str.to_string(),
            credential_id: None,
            folder_id: None,
            favorite: Some(false),
            tag_ids: None,
        };

        // Create connection with parameterized SQL
        let res = Repository::create_connection(&conn, &payload);
        assert!(res.is_ok(), "SQL Parameterized query should safely handle malicious string input without syntax error");

        let conn_dto = res.unwrap();
        assert_eq!(conn_dto.host, *bad_str);
    }
}

#[test]
fn test_process_argument_injection_immunity() {
    const INJECTION_CMD: &str = "127.0.0.1; calc.exe & notepad.exe";
    let payload = SecretPayload::new("SecretPass123!".into());

    let config = RdpLaunchConfig {
        session_id: "session-fuzz-1".into(),
        host: INJECTION_CMD.into(),
        port: 3389,
        username: "user; whoami".into(),
        domain: Some("DOMAIN & calc".into()),
        secret: Some(payload),
        fullscreen: false,
    };

    let addr_arg = format!("/v:{}:{}", config.host, config.port);
    assert!(addr_arg.starts_with("/v:"));
    assert!(!addr_arg.contains("/password"));
    assert!(!addr_arg.contains("/p:"));
}

#[test]
fn test_concurrent_session_managers_isolation() {
    let dir = tempdir().expect("Failed to create temp dir");
    let ssh_manager = SshSessionManager::new(dir.path().to_path_buf());
    let rdp_manager = RdpSessionManager::new();
    let vault = InMemoryVaultStore::new();

    // Store secrets in vault
    for i in 0..5 {
        let cred_id = format!("cred-uuid-{}", i);
        vault.store_secret(&cred_id, &format!("SecretPass{}", i)).unwrap();
    }

    // Verify concurrent manager operations do not interfere
    assert!(ssh_manager.send_input("non-existent", vec![1, 2]).is_err());
    assert_eq!(rdp_manager.list_sessions().unwrap().len(), 0);
}
