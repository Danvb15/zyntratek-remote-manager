import { safeInvoke } from "./client";
import { CredentialMetadata, CreateCredentialPayload, UpdateCredentialPayload } from "@/types/credential";

export const credentialService = {
  async listMetadata(): Promise<CredentialMetadata[]> {
    return safeInvoke<CredentialMetadata[]>("list_credentials_metadata");
  },

  async create(payload: CreateCredentialPayload): Promise<CredentialMetadata> {
    return safeInvoke<CredentialMetadata>("create_credential", { payload });
  },

  async update(id: string, payload: UpdateCredentialPayload): Promise<CredentialMetadata> {
    return safeInvoke<CredentialMetadata>("update_credential", { id, payload });
  },

  async delete(id: string): Promise<void> {
    return safeInvoke<void>("delete_credential", { id });
  },
};
