use async_trait::async_trait;
use std::process::Stdio;
use tokio::io::AsyncWriteExt;
use tokio::process::{Child, Command};

use crate::error::AppError;
use crate::protocols::rdp::win_cred;
use crate::vault::SecretPayload;

pub struct RdpLaunchConfig {
    pub session_id: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub domain: Option<String>,
    pub secret: Option<SecretPayload>,
    pub fullscreen: bool,
}

#[async_trait]
pub trait RdpLauncher: Send + Sync {
    async fn launch(&self, config: &RdpLaunchConfig) -> Result<(Child, String), AppError>;
    fn cleanup_credential(&self, target_name: &str);
}

pub struct WindowsRdpLauncher;

impl WindowsRdpLauncher {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WindowsRdpLauncher {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl RdpLauncher for WindowsRdpLauncher {
    async fn launch(&self, config: &RdpLaunchConfig) -> Result<(Child, String), AppError> {
        let addr = format!("{}:{}", config.host, config.port);

        // Windows Credential Manager target name
        let target_name = format!("TERMSRV/{}", config.host);

        let full_username = if let Some(d) = &config.domain {
            if !d.trim().is_empty() {
                format!("{}\\{}", d.trim(), config.username)
            } else {
                config.username.clone()
            }
        } else {
            config.username.clone()
        };

        // Write temporary Windows Credential if password exists
        if let Some(sec) = &config.secret {
            win_cred::write_windows_credential(&target_name, &full_username, sec.expose_secret())?;
        }

        let mut cmd = Command::new("mstsc.exe");
        cmd.arg(format!("/v:{}", addr));

        if config.fullscreen {
            cmd.arg("/f");
        }

        let child = cmd.spawn().map_err(|e| {
            // If process fails to spawn, cleanup credential immediately
            win_cred::delete_windows_credential(&target_name).ok();
            AppError::RdpError(format!("Fallo al iniciar el ejecutable mstsc.exe: {}", e))
        })?;

        Ok((child, target_name))
    }

    fn cleanup_credential(&self, target_name: &str) {
        let _ = win_cred::delete_windows_credential(target_name);
    }
}

pub struct UnixRdpLauncher;

impl UnixRdpLauncher {
    pub fn new() -> Self {
        Self
    }

    fn detect_freerdp_binary() -> Result<&'static str, AppError> {
        for bin in &["xfreerdp3", "xfreerdp", "wlfreerdp"] {
            if std::process::Command::new("which")
                .arg(bin)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
            {
                return Ok(bin);
            }
        }
        Err(AppError::RdpError(
            "Cliente RDP no encontrado. Por favor instale FreeRDP (xfreerdp) en el sistema.".into(),
        ))
    }
}

impl Default for UnixRdpLauncher {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl RdpLauncher for UnixRdpLauncher {
    async fn launch(&self, config: &RdpLaunchConfig) -> Result<(Child, String), AppError> {
        let binary = Self::detect_freerdp_binary()?;
        let addr = format!("{}:{}", config.host, config.port);

        let mut cmd = Command::new(binary);
        cmd.arg(format!("/v:{}", addr));
        cmd.arg(format!("/u:{}", config.username));

        if let Some(d) = &config.domain {
            if !d.trim().is_empty() {
                cmd.arg(format!("/d:{}", d.trim()));
            }
        }

        if config.fullscreen {
            cmd.arg("/f");
        }

        // Pass password via stdin (/from-stdin option)
        if config.secret.is_some() {
            cmd.arg("/from-stdin");
            cmd.stdin(Stdio::piped());
        }

        let mut child = cmd
            .spawn()
            .map_err(|e| AppError::RdpError(format!("Fallo al ejecutar {}: {}", binary, e)))?;

        // Pipe secret to stdin safely without exposing in arguments
        if let Some(sec) = &config.secret {
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(sec.expose_secret().as_bytes()).await;
                let _ = stdin.write_all(b"\n").await;
            }
        }

        let target_name = format!("unix_freerdp_{}", config.session_id);
        Ok((child, target_name))
    }

    fn cleanup_credential(&self, _target_name: &str) {
        // No OS credential persistence needed for FreeRDP stdin stream
    }
}

pub fn get_platform_launcher() -> Box<dyn RdpLauncher> {
    #[cfg(target_os = "windows")]
    {
        Box::new(WindowsRdpLauncher::new())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Box::new(UnixRdpLauncher::new())
    }
}
