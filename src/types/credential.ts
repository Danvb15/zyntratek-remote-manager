export type CredentialType = 'Password' | 'PrivateKey' | 'PassphraseKey';

export interface CredentialMetadata {
  id: string;
  name: string;
  credentialType: CredentialType;
  provider: 'OSKeyring';
  usernameHint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialPayload {
  name: string;
  credentialType: CredentialType;
  usernameHint?: string;
  secret: string;
}

export interface UpdateCredentialPayload {
  name?: string;
  credentialType?: CredentialType;
  usernameHint?: string;
  secret?: string;
}
