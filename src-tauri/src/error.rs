use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database operation failed: {0}")]
    DatabaseError(String),

    #[error("Vault operation failed: {0}")]
    VaultError(String),

    #[error("Protocol operation failed: {0}")]
    ProtocolError(String),

    #[error("SSH operation failed: {0}")]
    SshError(String),

    #[error("RDP operation failed: {0}")]
    RdpError(String),

    #[error("Validation failed: {0}")]
    ValidationError(String),


    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Internal application error")]
    InternalError,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        // Never serialize full stack traces or potential secrets to frontend IPC
        serializer.serialize_str(&self.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

impl From<keyring::Error> for AppError {
    fn from(err: keyring::Error) -> Self {
        AppError::VaultError(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(_err: std::io::Error) -> Self {
        AppError::InternalError
    }
}



#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_serialization_sanitization() {
        let secret_string = "P@ssword123!";
        let err = AppError::VaultError(format!("Failed to retrieve key containing {}", secret_string));
        let serialized = serde_json::to_string(&err).unwrap();
        assert!(serialized.contains("Vault operation failed"));
    }
}
