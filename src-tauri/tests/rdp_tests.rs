use zyntratek_remote_manager::protocols::rdp::launcher::RdpLaunchConfig;
use zyntratek_remote_manager::protocols::RdpSessionManager;
use zyntratek_remote_manager::vault::SecretPayload;

#[test]
fn test_rdp_launch_config_contains_zero_passwords_in_arguments() {
    const SECRET: &str = "SuperSecretPassword123!";
    let payload = SecretPayload::new(SECRET.into());

    let config = RdpLaunchConfig {
        session_id: "test-session-123".into(),
        host: "10.0.0.1".into(),
        port: 3389,
        username: "admin".into(),
        domain: Some("CORP".into()),
        secret: Some(payload),
        fullscreen: true,
    };

    // Verify arguments for Windows mstsc.exe
    let addr_arg = format!("/v:{}:{}", config.host, config.port);
    let args_windows = vec![addr_arg.clone(), "/f".into()];

    for arg in &args_windows {
        assert!(!arg.contains(SECRET), "Password leaked in Windows process arguments!");
        assert!(!arg.contains("/password"), "Forbidden /password parameter detected!");
    }

    // Verify arguments for Unix FreeRDP xfreerdp
    let args_unix = vec![
        format!("/v:{}", addr_arg),
        format!("/u:{}", config.username),
        format!("/d:CORP"),
        "/from-stdin".to_string(),
    ];

    for arg in &args_unix {
        assert!(!arg.contains(SECRET), "Password leaked in Unix process arguments!");
        assert!(!arg.contains("/p:"), "Forbidden /p: parameter detected!");
    }
}

#[test]
fn test_rdp_session_manager_initialization_and_listing() {
    let rdp_manager = RdpSessionManager::new();

    // Verify initially no active sessions
    let sessions = rdp_manager.list_sessions().expect("Failed to list RDP sessions");
    assert!(sessions.is_empty());

    // Verify disconnect on non-existent session
    let res = rdp_manager.disconnect("non-existent-session-uuid");
    assert!(res.is_err());
}
