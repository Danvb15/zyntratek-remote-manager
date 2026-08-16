use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Protocol {
    SSH,
    RDP,
    WEB,
    VNC,
    SFTP,
}

impl std::str::FromStr for Protocol {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "SSH" => Ok(Protocol::SSH),
            "RDP" => Ok(Protocol::RDP),
            "WEB" => Ok(Protocol::WEB),
            "VNC" => Ok(Protocol::VNC),
            "SFTP" => Ok(Protocol::SFTP),
            _ => Err(format!("Unknown protocol: {}", s)),
        }
    }
}

impl Protocol {
    pub fn as_str(&self) -> &'static str {
        match self {
            Protocol::SSH => "SSH",
            Protocol::RDP => "RDP",
            Protocol::WEB => "WEB",
            Protocol::VNC => "VNC",
            Protocol::SFTP => "SFTP",
        }
    }
}






#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CredentialType {
    Password,
    PrivateKey,
    PassphraseKey,
}

impl std::str::FromStr for CredentialType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Password" => Ok(CredentialType::Password),
            "PrivateKey" => Ok(CredentialType::PrivateKey),
            "PassphraseKey" => Ok(CredentialType::PassphraseKey),
            _ => Err(format!("Unknown credential type: {}", s)),
        }
    }
}

impl CredentialType {
    pub fn as_str(&self) -> &'static str {
        match self {
            CredentialType::Password => "Password",
            CredentialType::PrivateKey => "PrivateKey",
            CredentialType::PassphraseKey => "PassphraseKey",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagDto {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderDto {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Credential Metadata DTO - STRICTLY NO SECRET FIELDS HERE
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialMetadataDto {
    pub id: String,
    pub name: String,
    pub credential_type: CredentialType,
    pub provider: String,
    pub username_hint: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCredentialPayload {
    pub name: String,
    pub credential_type: CredentialType,
    pub username_hint: Option<String>,
    pub secret: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCredentialPayload {
    pub name: Option<String>,
    pub credential_type: Option<CredentialType>,
    pub username_hint: Option<String>,
    pub secret: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionDto {
    pub id: String,
    pub name: String,
    pub protocol: Protocol,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub credential_id: Option<String>,
    pub folder_id: Option<String>,
    pub favorite: bool,
    pub tags: Vec<TagDto>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateConnectionPayload {
    pub name: String,
    pub protocol: Protocol,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub credential_id: Option<String>,
    pub folder_id: Option<String>,
    pub favorite: Option<bool>,
    pub tag_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConnectionPayload {
    pub name: Option<String>,
    pub protocol: Option<Protocol>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub credential_id: Option<String>,
    pub folder_id: Option<String>,
    pub favorite: Option<bool>,
    pub tag_ids: Option<Vec<String>>,
}

