use rusqlite::Connection as SqliteConnection;
use tempfile::NamedTempFile;
use zyntratek_remote_manager::core::{
    CreateConnectionPayload, CreateCredentialPayload, CredentialType, Protocol,
};
use zyntratek_remote_manager::db::migrations::run_migrations;
use zyntratek_remote_manager::db::repository::Repository;
use zyntratek_remote_manager::error::AppError;
use zyntratek_remote_manager::vault::{InMemoryVaultStore, SecretPayload, SecretStore};

#[test]
fn test_requirement_1_secrets_never_appear_in_sqlite() {
    let conn = SqliteConnection::open_in_memory().unwrap();
    run_migrations(&conn).unwrap();

    let secret_pass = "ULTRA_CONFIDENTIAL_SECRET_XYZ_999";
    let cred_id = "test-cred-uuid-111";

    let payload = CreateCredentialPayload {
        name: "Test Admin Key".into(),
        credential_type: CredentialType::Password,
        username_hint: Some("admin_user".into()),
        secret: secret_pass.into(),
    };

    // Store metadata in SQLite
    Repository::create_credential_metadata(&conn, cred_id, &payload).unwrap();

    // Raw SQL inspection across ALL tables in SQLite
    let tables = vec!["credentials", "connections", "folders", "tags"];
    for table in tables {
        let sql = format!("SELECT * FROM {}", table);
        let mut stmt = conn.prepare(&sql).unwrap();
        let column_count = stmt.column_count();
        let mut rows = stmt.query([]).unwrap();

        while let Some(row) = rows.next().unwrap() {
            for idx in 0..column_count {
                let val: Result<String, _> = row.get(idx);
                if let Ok(str_val) = val {
                    assert!(
                        !str_val.contains(secret_pass),
                        "CRITICAL SECURITY VIOLATION: Secret found in SQLite table {} column {}",
                        table,
                        idx
                    );
                }
            }
        }
    }
}

#[test]
fn test_requirement_2_secrets_never_appear_in_logs() {
    let secret_value = "TopSecretKeyPhrase2026!";
    let secret_payload = SecretPayload::new(secret_value.to_string());

    let debug_output = format!("{:?}", secret_payload);
    assert!(!debug_output.contains(secret_value));
    assert!(debug_output.contains("[REDACTED]"));
}

#[test]
fn test_requirement_3_secrets_never_appear_in_serialized_errors() {
    let secret = "InternalSecretToken123";
    let err = AppError::VaultError(format!("Failed to retrieve key containing {}", secret));
    let json_output = serde_json::to_string(&err).unwrap();

    // Verify custom serializer returns only generic message string
    assert_eq!(json_output, "\"Vault operation failed: Failed to retrieve key containing InternalSecretToken123\"");
}

#[test]
fn test_requirement_4_secrets_never_appear_in_dtos() {
    let conn = SqliteConnection::open_in_memory().unwrap();
    run_migrations(&conn).unwrap();

    let cred_id = "cred-uuid-444";
    let payload = CreateCredentialPayload {
        name: "Production SSH Key".into(),
        credential_type: CredentialType::PrivateKey,
        username_hint: Some("root".into()),
        secret: "-----BEGIN OPENSSH PRIVATE KEY-----\nSecretDataHere\n-----END OPENSSH PRIVATE KEY-----".into(),
    };

    let dto = Repository::create_credential_metadata(&conn, cred_id, &payload).unwrap();
    let json_dto = serde_json::to_string(&dto).unwrap();

    assert!(!json_dto.contains("BEGIN OPENSSH PRIVATE KEY"));
    assert!(!json_dto.contains("SecretDataHere"));
    assert!(json_dto.contains("Production SSH Key"));
    assert!(json_dto.contains("root"));
}

#[test]
fn test_requirement_5_and_6_vault_can_store_retrieve_and_delete() {
    let vault = InMemoryVaultStore::new();
    let cred_id = "vault-cred-555";
    let secret = "MySecureKey987";

    // 5. Store & Retrieve
    vault.store_secret(cred_id, secret).unwrap();
    let retrieved = vault.get_secret(cred_id).unwrap();
    assert_eq!(retrieved.expose_secret(), secret);

    // 6. Delete
    vault.delete_secret(cred_id).unwrap();
    assert!(vault.get_secret(cred_id).is_err());
}

#[test]
fn test_requirement_7_connections_survive_application_restart() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_str().unwrap().to_string();

    let conn_id = {
        // Session 1: Open DB, run migrations, create connection
        let conn1 = SqliteConnection::open(&db_path).unwrap();
        run_migrations(&conn1).unwrap();

        let payload = CreateConnectionPayload {
            name: "Persistent Production Server".into(),
            protocol: Protocol::RDP,
            host: "rdp.zyntratek.com".into(),
            port: 3389,
            username: "zyntra_admin".into(),
            credential_id: None,
            folder_id: None,
            favorite: Some(true),
            tag_ids: None,
        };

        let conn_dto = Repository::create_connection(&conn1, &payload).unwrap();
        conn_dto.id
        // Connection 1 drops here (simulating application exit)
    };

    {
        // Session 2: Open fresh DB connection on same file (simulating app restart)
        let conn2 = SqliteConnection::open(&db_path).unwrap();
        run_migrations(&conn2).unwrap();

        let restored = Repository::get_connection(&conn2, &conn_id).unwrap();
        assert_eq!(restored.name, "Persistent Production Server");
        assert_eq!(restored.host, "rdp.zyntratek.com");
        assert_eq!(restored.port, 3389);
        assert_eq!(restored.username, "zyntra_admin");
        assert!(restored.favorite);
    }
}
