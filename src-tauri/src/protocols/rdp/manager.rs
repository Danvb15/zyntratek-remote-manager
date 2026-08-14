use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use zeroize::Zeroize;

use crate::error::AppError;
use crate::protocols::rdp::launcher::{get_platform_launcher, RdpLaunchConfig};
use crate::protocols::rdp::session::{RdpSessionDto, RdpSessionStatus};
use crate::protocols::rdp::win_cred;
use crate::vault::SecretPayload;

struct ActiveRdpSession {
    dto: RdpSessionDto,
    target_name: String,
}

pub struct RdpSessionManager {
    sessions: Arc<Mutex<HashMap<String, ActiveRdpSession>>>,
}

impl RdpSessionManager {
    pub fn new() -> Self {
        // Clean any leftover orphan credentials on startup
        win_cred::cleanup_orphaned_windows_credentials();

        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start_session(

        &self,
        connection_id: String,
        host: String,
        port: u16,
        username: String,
        domain: Option<String>,
        mut secret: Option<SecretPayload>,
        fullscreen: bool,
    ) -> Result<String, AppError> {
        let session_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let config = RdpLaunchConfig {
            session_id: session_id.clone(),
            host: host.clone(),
            port,
            username: username.clone(),
            domain,
            secret: secret.take(),
            fullscreen,
        };

        let launcher = get_platform_launcher();

        // Launch child process and register temporary Windows credential
        let (mut child, target_name) = launcher.launch(&config).await?;

        // Zeroize RAM secret payload immediately
        if let Some(mut sec) = config.secret {
            sec.zeroize();
        }

        let dto = RdpSessionDto {
            id: session_id.clone(),
            connection_id,
            host,
            port,
            username,
            status: RdpSessionStatus::Running,
            created_at: now,
        };

        let session_entry = ActiveRdpSession {
            dto,
            target_name: target_name.clone(),
        };

        {
            let mut map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
            map.insert(session_id.clone(), session_entry);
        }

        let sessions_map = self.sessions.clone();
        let session_id_clone = session_id.clone();
        let target_name_clone = target_name.clone();

        // Monitor child process exit in Tokio background task for immediate cleanup
        tokio::spawn(async move {
            let _ = child.wait().await;

            // Immediately delete temporary Windows credential when process finishes
            launcher.cleanup_credential(&target_name_clone);

            if let Ok(mut map) = sessions_map.lock() {
                if let Some(sess) = map.get_mut(&session_id_clone) {
                    sess.dto.status = RdpSessionStatus::Exited;
                }
            }
        });

        Ok(session_id)
    }

    pub fn list_sessions(&self) -> Result<Vec<RdpSessionDto>, AppError> {
        let map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
        Ok(map.values().map(|s| s.dto.clone()).collect())
    }

    pub fn disconnect(&self, session_id: &str) -> Result<(), AppError> {
        let mut map = self.sessions.lock().map_err(|_| AppError::InternalError)?;
        if let Some(sess) = map.get_mut(session_id) {
            sess.dto.status = RdpSessionStatus::Exited;
            win_cred::delete_windows_credential(&sess.target_name).ok();
            Ok(())
        } else {
            Err(AppError::NotFound(format!("Sesión RDP {} no encontrada", session_id)))
        }
    }
}

impl Default for RdpSessionManager {
    fn default() -> Self {
        Self::new()
    }
}
