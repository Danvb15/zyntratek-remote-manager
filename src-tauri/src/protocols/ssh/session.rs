use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::mpsc;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum SshEvent {
    Output(Vec<u8>),
    Status(String),
    Error(String),
    Exit(u32),
}

pub struct ActiveSession {
    pub id: String,
    pub connection_id: String,
    pub tx_input: mpsc::Sender<Vec<u8>>,
    pub tx_resize: mpsc::Sender<(u32, u32)>,
    pub running: Arc<AtomicBool>,
}

impl ActiveSession {
    pub fn send_input(&self, data: Vec<u8>) -> Result<(), String> {
        self.tx_input
            .try_send(data)
            .map_err(|e| format!("Failed to send input to SSH session: {}", e))
    }

    pub fn resize_pty(&self, cols: u32, rows: u32) -> Result<(), String> {
        self.tx_resize
            .try_send((cols, rows))
            .map_err(|e| format!("Failed to resize PTY: {}", e))
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::SeqCst);
    }
}
