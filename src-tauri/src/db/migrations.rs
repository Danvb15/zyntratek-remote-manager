use rusqlite::Connection;
use crate::error::AppError;
use super::schema::INIT_SCHEMA;

pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(INIT_SCHEMA)?;
    Ok(())
}
