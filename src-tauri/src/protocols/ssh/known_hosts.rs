use std::collections::HashMap;
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use crate::error::AppError;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum HostVerificationResult {
    Verified,
    Unknown { host: String, port: u16, key_type: String, fingerprint: String },
    KeyChanged { host: String, port: u16, expected_fingerprint: String, actual_fingerprint: String },
}

pub struct KnownHostsStore {
    file_path: PathBuf,
    entries: Mutex<HashMap<String, String>>, // "host:port" -> "key_type fingerprint"
}

impl KnownHostsStore {
    pub fn new(app_dir: PathBuf) -> Self {
        let file_path = app_dir.join("known_hosts");
        let store = Self {
            file_path,
            entries: Mutex::new(HashMap::new()),
        };
        let _ = store.load();
        store
    }

    fn host_key(host: &str, port: u16) -> String {
        format!("{}:{}", host, port)
    }

    pub fn load(&self) -> Result<(), AppError> {
        let mut entries = self.entries.lock().map_err(|_| AppError::InternalError)?;
        entries.clear();

        if !self.file_path.exists() {
            return Ok(());
        }

        let file = fs::File::open(&self.file_path)?;
        let reader = BufReader::new(file);

        for line in reader.lines().map_while(Result::ok) {

            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {

                continue;
            }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let key = parts[0].to_string();
                let val = format!("{} {}", parts[1], parts[2]);
                entries.insert(key, val);
            }
        }
        Ok(())
    }

    pub fn verify_host(&self, host: &str, port: u16, key_type: &str, fingerprint: &str) -> HostVerificationResult {
        let key = Self::host_key(host, port);
        let entries = match self.entries.lock() {
            Ok(e) => e,
            Err(_) => return HostVerificationResult::Unknown {
                host: host.to_string(),
                port,
                key_type: key_type.to_string(),
                fingerprint: fingerprint.to_string(),
            },
        };

        if let Some(existing) = entries.get(&key) {
            let expected_fp = existing.split_whitespace().nth(1).unwrap_or("");
            if expected_fp == fingerprint {
                HostVerificationResult::Verified
            } else {
                HostVerificationResult::KeyChanged {
                    host: host.to_string(),
                    port,
                    expected_fingerprint: expected_fp.to_string(),
                    actual_fingerprint: fingerprint.to_string(),
                }
            }
        } else {
            HostVerificationResult::Unknown {
                host: host.to_string(),
                port,
                key_type: key_type.to_string(),
                fingerprint: fingerprint.to_string(),
            }
        }
    }

    pub fn trust_host(&self, host: &str, port: u16, key_type: &str, fingerprint: &str) -> Result<(), AppError> {
        let key = Self::host_key(host, port);
        let val = format!("{} {}", key_type, fingerprint);

        {
            let mut entries = self.entries.lock().map_err(|_| AppError::InternalError)?;
            entries.insert(key.clone(), val.clone());
        }

        if let Some(parent) = self.file_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.file_path)?;

        writeln!(file, "{} {} {}", key, key_type, fingerprint)?;
        Ok(())
    }
}
