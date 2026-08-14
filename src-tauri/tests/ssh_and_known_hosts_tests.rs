use zyntratek_remote_manager::protocols::ssh::known_hosts::{KnownHostsStore, HostVerificationResult};
use zyntratek_remote_manager::protocols::SshSessionManager;
use tempfile::tempdir;

#[test]
fn test_known_hosts_verification_lifecycle() {
    let dir = tempdir().expect("Failed to create temp dir");
    let store = KnownHostsStore::new(dir.path().to_path_buf());

    let host = "192.168.1.100";
    let port = 22;
    let key_type = "ssh-ed25519";
    let fingerprint = "SHA256:abc123def456xyz7890";

    // 1. Unknown host initially
    let res = store.verify_host(host, port, key_type, fingerprint);
    assert_eq!(
        res,
        HostVerificationResult::Unknown {
            host: host.to_string(),
            port,
            key_type: key_type.to_string(),
            fingerprint: fingerprint.to_string(),
        }
    );

    // 2. Trust host
    store.trust_host(host, port, key_type, fingerprint).expect("Failed to trust host");

    // 3. Verify trusted host -> Verified
    let res2 = store.verify_host(host, port, key_type, fingerprint);
    assert_eq!(res2, HostVerificationResult::Verified);

    // 4. Verification with changed key -> KeyChanged
    let res3 = store.verify_host(host, port, key_type, "SHA256:DIFFERENT_FINGERPRINT_MALICIOUS");
    assert_eq!(
        res3,
        HostVerificationResult::KeyChanged {
            host: host.to_string(),
            port,
            expected_fingerprint: fingerprint.to_string(),
            actual_fingerprint: "SHA256:DIFFERENT_FINGERPRINT_MALICIOUS".to_string(),
        }
    );
}

#[test]
fn test_ssh_session_manager_initialization() {
    let dir = tempdir().expect("Failed to create temp dir");
    let manager = SshSessionManager::new(dir.path().to_path_buf());

    // Verify error handling on non-existent session Operations
    let res = manager.send_input("non-existent-session", vec![1, 2, 3]);
    assert!(res.is_err());

    let res_disconnect = manager.disconnect("non-existent-session");
    assert!(res_disconnect.is_err());
}
