import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Connection, CreateConnectionPayload, Protocol, UpdateConnectionPayload } from "@/types/connection";
import { CredentialMetadata } from "@/types/credential";
import { Folder } from "@/types/folder";
import { Tag } from "@/types/connection";

interface ConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateConnectionPayload | UpdateConnectionPayload) => Promise<void>;
  initialConnection?: Connection | null;
  credentials: CredentialMetadata[];
  folders: Folder[];
  tags: Tag[];
}

export const ConnectionFormModal: React.FC<ConnectionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConnection,
  credentials,
  folders,
  tags,
}) => {
  const isEditing = !!initialConnection;

  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState<Protocol>("SSH");
  const [host, setHost] = useState("");
  const [portInput, setPortInput] = useState<string>("");
  const [username, setUsername] = useState("");
  const [credentialId, setCredentialId] = useState<string>("");
  const [folderId, setFolderId] = useState<string>("");
  const [favorite, setFavorite] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialConnection) {
      setName(initialConnection.name);
      setProtocol(initialConnection.protocol);
      setHost(initialConnection.host);
      setPortInput(initialConnection.port ? initialConnection.port.toString() : "");
      setUsername(initialConnection.username);
      setCredentialId(initialConnection.credentialId || "");
      setFolderId(initialConnection.folderId || "");
      setFavorite(initialConnection.favorite);
      setSelectedTagIds(initialConnection.tags.map((t) => t.id));
    } else {
      setName("");
      setProtocol("SSH");
      setHost("");
      setPortInput("");
      setUsername("");
      setCredentialId("");
      setFolderId("");
      setFavorite(false);
      setSelectedTagIds([]);
    }
    setError(null);
  }, [initialConnection, isOpen]);

  // Handle Protocol Change
  const handleProtocolChange = (newProtocol: Protocol) => {
    setProtocol(newProtocol);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("El nombre de la conexión es obligatorio.");
      return;
    }
    if (!host.trim()) {
      setError("El host o dirección IP es obligatorio.");
      return;
    }
    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }

    const defaultPort = protocol === "SSH" ? 22 : 3389;
    let finalPort = defaultPort;

    if (portInput.trim() !== "") {
      const parsedPort = parseInt(portInput.trim(), 10);
      if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        setError("El puerto debe ser un número entero entre 1 y 65535.");
        return;
      }
      finalPort = parsedPort;
    }

    setSubmitting(true);
    try {
      const payload: CreateConnectionPayload = {
        name: name.trim(),
        protocol,
        host: host.trim(),
        port: finalPort,
        username: username.trim(),
        credentialId: credentialId || undefined,
        folderId: folderId || undefined,
        favorite,
        tagIds: selectedTagIds,
      };
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudo guardar la conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Conexión" : "Nueva Conexión Remota"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Protocol Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Protocolo
            </label>
            <select
              value={protocol}
              onChange={(e) => handleProtocolChange(e.target.value as Protocol)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="SSH">SSH (Secure Shell)</option>
              <option value="RDP">RDP (Remote Desktop)</option>
            </select>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nombre de la Conexión *
            </label>
            <input
              type="text"
              placeholder="ej. Servidor Producción 01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Host */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Host / IP *
          </label>
          <input
            type="text"
            placeholder="192.168.1.100 o hostname (ej. root@10.100.10.5)"
            value={host}
            onChange={(e) => {
              const val = e.target.value;
              let cleanHost = val;
              if (cleanHost.includes("@")) {
                const parts = cleanHost.split("@");
                if (parts[0]) {
                  setUsername(parts[0]);
                }
                cleanHost = parts[1] || "";
              }
              if (cleanHost.includes(":")) {
                const parts = cleanHost.split(":");
                cleanHost = parts[0] || "";
                if (parts[1]) {
                  setPortInput(parts[1]);
                }
              }
              setHost(cleanHost);
            }}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
        </div>

          {/* Optional Port */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Puerto</span>
              <span className="text-[10px] text-muted-foreground font-normal lowercase">(opcional)</span>
            </label>
            <input
              type="number"
              placeholder={protocol === "SSH" ? "22" : "3389"}
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nombre de Usuario *
          </label>
          <input
            type="text"
            placeholder="ej. root, Administrator, devops"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Credential Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Credencial (Vault)
            </label>
            <select
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Ninguna (Ingreso manual al conectar) --</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name} ({cred.credentialType} {cred.usernameHint ? `- ${cred.usernameHint}` : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Folder Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Carpeta
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Raíz (Sin carpeta) --</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Selection */}
        {tags.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Etiquetas (Tags)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Favorite checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="favorite-checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            className="rounded-xs border-border bg-secondary text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="favorite-checkbox" className="text-sm font-medium text-foreground cursor-pointer">
            Marcar como favorito ⭐
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
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
            {isEditing ? "Guardar Cambios" : "Crear Conexión"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
