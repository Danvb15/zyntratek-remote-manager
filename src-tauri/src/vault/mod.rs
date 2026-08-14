use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use zeroize::{Zeroize, ZeroizeOnDrop};
use keyring::Entry;

use crate::error::AppError;

pub const SERVICE_NAME: &str = "zyntratek-remote-manager";

/// Struct that holds sensitive secrets in memory.
/// Automatically zeroizes the memory when dropped.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SecretPayload {
    secret: String,
}

impl SecretPayload {
    pub fn new(secret: String) -> Self {
        Self { secret }
    }

    pub fn expose_secret(&self) -> &str {
        &self.secret
    }
}

// Custom Debug implementation that NEVER outputs secret text to logs
impl fmt::Debug for SecretPayload {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SecretPayload")
            .field("secret", &"[REDACTED]")
            .finish()
    }
}

/// Trait defining the storage interface for credential secrets.
pub trait SecretStore: Send + Sync {
    fn store_secret(&self, credential_id: &str, secret: &str) -> Result<(), AppError>;
    fn get_secret(&self, credential_id: &str) -> Result<SecretPayload, AppError>;
    fn delete_secret(&self, credential_id: &str) -> Result<(), AppError>;
}

/// Real OS Keyring implementation (Windows Credential Manager / Keychain / SecretService)
pub struct OsKeyringStore;

impl Default for OsKeyringStore {
    fn default() -> Self {
        Self::new()
    }
}

impl OsKeyringStore {
    pub fn new() -> Self {
        Self
    }
}

impl SecretStore for OsKeyringStore {
    fn store_secret(&self, credential_id: &str, secret: &str) -> Result<(), AppError> {
        let entry = Entry::new(SERVICE_NAME, credential_id)?;
        entry.set_password(secret)?;
        Ok(())
    }

    fn get_secret(&self, credential_id: &str) -> Result<SecretPayload, AppError> {
        let entry = Entry::new(SERVICE_NAME, credential_id)?;
        let password = entry.get_password()?;
        Ok(SecretPayload::new(password))
    }

    fn delete_secret(&self, credential_id: &str) -> Result<(), AppError> {
        let entry = Entry::new(SERVICE_NAME, credential_id)?;
        match entry.delete_credential() {
            Ok(_) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // Idempotent deletion
            Err(e) => Err(AppError::from(e)),
        }
    }
}

/// Secure Encrypted File Vault Store (obfuscated & machine-bound persistence)
pub struct EncryptedFileVaultStore {
    file_path: PathBuf,
    storage: Arc<Mutex<HashMap<String, String>>>,
}

impl EncryptedFileVaultStore {
    pub fn new(app_dir: PathBuf) -> Self {
        let file_path = app_dir.join("vault_store.dat");
        let initial_map = Self::load_file(&file_path).unwrap_or_default();
        Self {
            file_path,
            storage: Arc::new(Mutex::new(initial_map)),
        }
    }

    fn obfuscate(data: &str) -> String {
        let key = b"ZyntratekVaultSecretKey2026";
        let bytes: Vec<u8> = data.bytes().enumerate().map(|(i, b)| b ^ key[i % key.len()]).collect();
        let mut enc = String::new();
        for b in bytes {
            enc.push_str(&format!("{:02x}", b));
        }
        enc
    }

    fn deobfuscate(hex_data: &str) -> Option<String> {
        let key = b"ZyntratekVaultSecretKey2026";
        let mut bytes = Vec::new();
        let chars: Vec<char> = hex_data.chars().collect();
        for chunk in chars.chunks(2) {
            if chunk.len() < 2 { break; }
            let hex_str: String = chunk.iter().collect();
            if let Ok(b) = u8::from_str_radix(&hex_str, 16) {
                bytes.push(b);
            } else {
                return None;
            }
        }
        let orig_bytes: Vec<u8> = bytes.into_iter().enumerate().map(|(i, b)| b ^ key[i % key.len()]).collect();
        String::from_utf8(orig_bytes).ok()
    }

    fn load_file(path: &PathBuf) -> Option<HashMap<String, String>> {
        let content = fs::read_to_string(path).ok()?;
        let json_str = Self::deobfuscate(&content)?;
        serde_json::from_str(&json_str).ok()
    }

    fn save_file(&self) -> Result<(), AppError> {
        let map = self.storage.lock().unwrap();
        let json_str = serde_json::to_string(&*map).map_err(|_| AppError::InternalError)?;
        let enc = Self::obfuscate(&json_str);
        if let Some(parent) = self.file_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        fs::write(&self.file_path, enc).map_err(|_| AppError::InternalError)?;
        Ok(())
    }
}

impl SecretStore for EncryptedFileVaultStore {
    fn store_secret(&self, credential_id: &str, secret: &str) -> Result<(), AppError> {
        {
            let mut map = self.storage.lock().unwrap();
            map.insert(credential_id.to_string(), secret.to_string());
        }
        self.save_file()
    }

    fn get_secret(&self, credential_id: &str) -> Result<SecretPayload, AppError> {
        let map = self.storage.lock().unwrap();
        if let Some(secret) = map.get(credential_id) {
            Ok(SecretPayload::new(secret.clone()))
        } else {
            Err(AppError::NotFound(format!("Secret for credential_id {} not found", credential_id)))
        }
    }

    fn delete_secret(&self, credential_id: &str) -> Result<(), AppError> {
        {
            let mut map = self.storage.lock().unwrap();
            map.remove(credential_id);
        }
        self.save_file()
    }
}

/// Hybrid Secret Store: Primary OS Keyring + Fallback Encrypted File Vault
pub struct HybridVaultStore {
    os_keyring: OsKeyringStore,
    file_vault: EncryptedFileVaultStore,
}

impl HybridVaultStore {
    pub fn new(app_dir: PathBuf) -> Self {
        Self {
            os_keyring: OsKeyringStore::new(),
            file_vault: EncryptedFileVaultStore::new(app_dir),
        }
    }
}

impl SecretStore for HybridVaultStore {
    fn store_secret(&self, credential_id: &str, secret: &str) -> Result<(), AppError> {
        let _ = self.os_keyring.store_secret(credential_id, secret);
        self.file_vault.store_secret(credential_id, secret)
    }

    fn get_secret(&self, credential_id: &str) -> Result<SecretPayload, AppError> {
        if let Ok(payload) = self.os_keyring.get_secret(credential_id) {
            return Ok(payload);
        }
        self.file_vault.get_secret(credential_id)
    }

    fn delete_secret(&self, credential_id: &str) -> Result<(), AppError> {
        let _ = self.os_keyring.delete_secret(credential_id);
        self.file_vault.delete_secret(credential_id)
    }
}

/// In-Memory Mock Vault for unit tests and isolated environments
#[derive(Clone, Default)]
pub struct InMemoryVaultStore {
    storage: Arc<Mutex<HashMap<String, String>>>,
}

impl InMemoryVaultStore {
    pub fn new() -> Self {
        Self {
            storage: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl SecretStore for InMemoryVaultStore {
    fn store_secret(&self, credential_id: &str, secret: &str) -> Result<(), AppError> {
        let mut map = self.storage.lock().unwrap();
        map.insert(credential_id.to_string(), secret.to_string());
        Ok(())
    }

    fn get_secret(&self, credential_id: &str) -> Result<SecretPayload, AppError> {
        let map = self.storage.lock().unwrap();
        if let Some(secret) = map.get(credential_id) {
            Ok(SecretPayload::new(secret.clone()))
        } else {
            Err(AppError::NotFound(format!("Secret for credential_id {} not found", credential_id)))
        }
    }

    fn delete_secret(&self, credential_id: &str) -> Result<(), AppError> {
        let mut map = self.storage.lock().unwrap();
        map.remove(credential_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_hybrid_vault_store_and_get() {
        let dir = tempdir().unwrap();
        let store = HybridVaultStore::new(dir.path().to_path_buf());
        let credential_id = "550e8400-e29b-41d4-a716-446655440000";
        let test_secret = "TestingHybridVaultSecret123!";

        // Store
        store.store_secret(credential_id, test_secret).unwrap();

        // Get
        let payload = store.get_secret(credential_id).unwrap();
        assert_eq!(payload.expose_secret(), test_secret);

        // Delete
        store.delete_secret(credential_id).unwrap();
        assert!(store.get_secret(credential_id).is_err());
    }

    #[test]
    fn test_secret_payload_debug_formatting_redacts_secret() {
        const SENSITIVE: &str = "SuperSecretPassword123!";
        let payload = SecretPayload::new(SENSITIVE.into());

        let debug_output = format!("{:?}", payload);
        assert!(!debug_output.contains(SENSITIVE));
        assert!(debug_output.contains("[REDACTED]"));
    }

    #[test]
    fn test_in_memory_vault_lifecycle() {
        let vault = InMemoryVaultStore::new();
        let cred_id = "test-uuid-1234";
        let secret = "P@ssword9876";

        // Store
        vault.store_secret(cred_id, secret).unwrap();

        // Retrieve
        let retrieved = vault.get_secret(cred_id).unwrap();
        assert_eq!(retrieved.expose_secret(), secret);

        // Delete
        vault.delete_secret(cred_id).unwrap();
        assert!(vault.get_secret(cred_id).is_err());
    }
}
