use async_trait::async_trait;
use russh::client::Handler;
use ssh_key::PublicKey;

pub struct SshClientHandler {
    pub server_key: Option<PublicKey>,
}

impl SshClientHandler {
    pub fn new() -> Self {
        Self { server_key: None }
    }
}

impl Default for SshClientHandler {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Handler for SshClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        server_public_key: &PublicKey,
    ) -> Result<bool, Self::Error> {
        self.server_key = Some(server_public_key.clone());
        Ok(true)
    }
}
