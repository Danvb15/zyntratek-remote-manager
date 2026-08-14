import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CredentialMetadata, CredentialType, CreateCredentialPayload, UpdateCredentialPayload } from "@/types/credential";
import { Eye, EyeOff, Lock, Trash } from "lucide-react";

interface CredentialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCredentialPayload | UpdateCredentialPayload) => Promise<void>;
  initialCredential?: CredentialMetadata | null;
}

export const CredentialFormModal: React.FC<CredentialFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCredential,
}) => {
  const isEditing = !!initialCredential;

  const [name, setName] = useState("");
  const [credentialType, setCredentialType] = useState<CredentialType>("Password");
  const [usernameHint, setUsernameHint] = useState("");
  const [secret, setSecret] = useState("");

  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCredential) {
      setName(initialCredential.name);
      setCredentialType(initialCredential.credentialType);
      setUsernameHint(initialCredential.usernameHint || "");
      setSecret(""); // Secrets are NEVER retrieved from backend during edit
    } else {
      setName("");
      setCredentialType("Password");
      setUsernameHint("");
      setSecret("");
    }
    setShowSecret(false);
    setError(null);
  }, [initialCredential, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la credencial es obligatorio.");
      return;
    }

    if (!isEditing && !secret.trim()) {
      setError("El secreto (contraseña o clave privada) es obligatorio al crear la credencial.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const payload: UpdateCredentialPayload = {
          name: name.trim(),
          credentialType,
          usernameHint: usernameHint.trim() || undefined,
          secret: secret.trim() ? secret.trim() : undefined,
        };
        await onSave(payload);
      } else {
        const payload: CreateCredentialPayload = {
          name: name.trim(),
          credentialType,
          usernameHint: usernameHint.trim() || undefined,
          secret: secret.trim(),
        };
        await onSave(payload);
      }

      // Clear secret transient state immediately upon successful submit
      setSecret("");
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudo guardar la credencial en el vault.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSecret("");
        onClose();
      }}
      title={isEditing ? `Editar Credencial: ${initialCredential?.name}` : "Guardar Nueva Credencial en Vault"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary flex items-start gap-2.5">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Las credenciales se guardan directamente en el <strong>OS Keyring nativo</strong>. Nunca se almacenan en texto plano ni en la base de datos de metadatos.
          </span>
        </div>

        {/* Credential Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nombre de la Credencial *
          </label>
          <input
            type="text"
            placeholder="ej. Password Root Producción, Key ED25519 DevOps"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tipo de Credencial
            </label>
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value as CredentialType)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="Password">Contraseña (Password)</option>
              <option value="PrivateKey">Clave Privada SSH (PrivateKey)</option>
              <option value="PassphraseKey">Clave Privada + Passphrase</option>
            </select>
          </div>

          {/* Username Hint */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Usuario de Referencia (Hint)
            </label>
            <input
              type="text"
              placeholder="ej. root, ubuntu"
              value={usernameHint}
              onChange={(e) => setUsernameHint(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Secret Input Area (Transient in memory) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isEditing ? "Nuevo Secreto (Dejar en blanco para conservar actual)" : "Secreto (Contraseña / Clave Privada) *"}
            </label>
            {secret && (
              <button
                type="button"
                onClick={() => setSecret("")}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>

          {credentialType === "Password" ? (
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                placeholder="••••••••••••"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg pl-3 pr-10 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <textarea
              rows={4}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary resize-y"
            />
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setSecret("");
              onClose();
            }}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2"
          >
            {submitting && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {isEditing ? "Actualizar Vault" : "Guardar en Keyring"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
