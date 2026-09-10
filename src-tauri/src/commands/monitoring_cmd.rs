use std::time::Instant;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use tokio::net::TcpStream;
use tokio::time::{timeout, Duration};

use crate::db::repository::Repository;
use crate::db::DbState;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerPingResult {
    pub connection_id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub protocol: String,
    pub is_online: bool,
    pub latency_ms: u32,
    pub error: Option<String>,
}

#[command]
pub async fn check_single_server_ping(
    connection_id: String,
    name: Option<String>,
    host: String,
    port: u16,
    protocol: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<ServerPingResult, AppError> {
    let timeout_duration = Duration::from_millis(timeout_ms.unwrap_or(2500));
    let addr = format!("{}:{}", host.trim(), port);

    let start = Instant::now();
    match timeout(timeout_duration, TcpStream::connect(&addr)).await {
        Ok(Ok(_stream)) => {
            let latency_ms = start.elapsed().as_millis() as u32;
            Ok(ServerPingResult {
                connection_id,
                name: name.unwrap_or_default(),
                host,
                port,
                protocol: protocol.unwrap_or_default(),
                is_online: true,
                latency_ms,
                error: None,
            })
        }
        Ok(Err(e)) => {
            Ok(ServerPingResult {
                connection_id,
                name: name.unwrap_or_default(),
                host,
                port,
                protocol: protocol.unwrap_or_default(),
                is_online: false,
                latency_ms: 0,
                error: Some(format!("Error de red: {}", e)),
            })
        }
        Err(_) => {
            Ok(ServerPingResult {
                connection_id,
                name: name.unwrap_or_default(),
                host,
                port,
                protocol: protocol.unwrap_or_default(),
                is_online: false,
                latency_ms: 0,
                error: Some(format!("Timeout (>{}ms)", timeout_duration.as_millis())),
            })
        }
    }
}

#[command]
pub async fn check_all_servers_ping(
    db: State<'_, DbState>,
    timeout_ms: Option<u64>,
) -> Result<Vec<ServerPingResult>, AppError> {
    let connections = {
        let conn = db.conn.lock().map_err(|_| AppError::InternalError)?;
        Repository::list_connections(&conn)?
    };

    let timeout_val = timeout_ms.unwrap_or(2500);
    let mut tasks = tokio::task::JoinSet::new();

    for conn in connections {
        let conn_id = conn.id;
        let conn_name = conn.name;
        let host = conn.host;
        let port = conn.port;
        let protocol = format!("{:?}", conn.protocol);

        tasks.spawn(async move {
            let timeout_duration = Duration::from_millis(timeout_val);
            let addr = format!("{}:{}", host.trim(), port);

            let start = Instant::now();
            match timeout(timeout_duration, TcpStream::connect(&addr)).await {
                Ok(Ok(_stream)) => {
                    let latency_ms = start.elapsed().as_millis() as u32;
                    ServerPingResult {
                        connection_id: conn_id,
                        name: conn_name,
                        host,
                        port,
                        protocol,
                        is_online: true,
                        latency_ms,
                        error: None,
                    }
                }
                Ok(Err(e)) => {
                    ServerPingResult {
                        connection_id: conn_id,
                        name: conn_name,
                        host,
                        port,
                        protocol,
                        is_online: false,
                        latency_ms: 0,
                        error: Some(format!("Error de red: {}", e)),
                    }
                }
                Err(_) => {
                    ServerPingResult {
                        connection_id: conn_id,
                        name: conn_name,
                        host,
                        port,
                        protocol,
                        is_online: false,
                        latency_ms: 0,
                        error: Some(format!("Timeout (>{}ms)", timeout_val)),
                    }
                }
            }
        });
    }

    let mut results = Vec::new();
    while let Some(res) = tasks.join_next().await {
        if let Ok(ping_res) = res {
            results.push(ping_res);
        }
    }

    results.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(results)
}
