use rusqlite::Connection;
use crate::error::AppError;
use super::schema::INIT_SCHEMA;

pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    // 1. Initial schema creation
    conn.execute_batch(INIT_SCHEMA)?;

    // 2. Migration: Remove restrictive CHECK constraint on protocol if present in legacy DB
    let sql: Option<String> = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='connections'",
            [],
            |row| row.get(0),
        )
        .ok();

    if let Some(table_sql) = sql {
        if table_sql.contains("CHECK(protocol IN") {
            conn.execute_batch(
                r#"
                PRAGMA foreign_keys=OFF;
                BEGIN TRANSACTION;
                CREATE TABLE connections_new (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    protocol TEXT NOT NULL,
                    host TEXT NOT NULL,
                    port INTEGER NOT NULL,
                    username TEXT NOT NULL,
                    credential_id TEXT REFERENCES credentials(id) ON DELETE SET NULL,
                    folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
                    favorite INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                INSERT INTO connections_new SELECT id, name, protocol, host, port, username, credential_id, folder_id, favorite, created_at, updated_at FROM connections;
                DROP TABLE connections;
                ALTER TABLE connections_new RENAME TO connections;
                CREATE INDEX IF NOT EXISTS idx_connections_folder ON connections(folder_id);
                CREATE INDEX IF NOT EXISTS idx_connections_favorite ON connections(favorite);
                COMMIT;
                PRAGMA foreign_keys=ON;
                "#,
            )?;
        }
    }

    Ok(())
}

