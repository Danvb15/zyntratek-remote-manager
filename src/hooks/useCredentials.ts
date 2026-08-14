import { useState, useEffect, useCallback } from "react";
import { CredentialMetadata, CreateCredentialPayload, UpdateCredentialPayload } from "@/types/credential";
import { credentialService } from "@/services/tauri/credentials";

export function useCredentials() {
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await credentialService.listMetadata();
      setCredentials(data);
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudieron cargar las credenciales del vault.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const createCredential = async (payload: CreateCredentialPayload) => {
    const created = await credentialService.create(payload);
    setCredentials((prev) => [...prev, created]);
    return created;
  };

  const updateCredential = async (id: string, payload: UpdateCredentialPayload) => {
    const updated = await credentialService.update(id, payload);
    setCredentials((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCredential = async (id: string) => {
    await credentialService.delete(id);
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    credentials,
    loading,
    error,
    refresh: fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
  };
}
