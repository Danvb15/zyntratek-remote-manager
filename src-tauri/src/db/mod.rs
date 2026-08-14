pub mod migrations;
pub mod repository;
pub mod schema;

use std::sync::Mutex;
use rusqlite::Connection;
use crate::error::AppError;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new_in_memory() -> Result<Self, AppError> {
        let conn = Connection::open_in_memory()?;
        migrations::run_migrations(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn new_file_db(db_path: &str) -> Result<Self, AppError> {
        let conn = Connection::open(db_path)?;
        migrations::run_migrations(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
