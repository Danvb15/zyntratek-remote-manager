import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";

interface InteractivePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (password: string, saveToVault: boolean) => Promise<void>;
  connectionName: string;
  username: string;
  host: string;
}

export const InteractivePasswordModal: React.FC<InteractivePasswordModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  connectionName,
  username,
  host,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saveToVault, setSaveToVault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Por favor ingresa la contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      await onConnect(password, saveToVault);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Fallo al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Autenticación Requerida - ${connectionName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-secondary/50 border border-border rounded-lg flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-primary shrink-0" />
          <div className="text-xs">
            <span className="text-muted-foreground">Ingresa la contraseña para </span>
            <span className="font-mono font-semibold text-foreground">
              {username}@{host}
            </span>
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña de servidor"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg pl-3 pr-10 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Save to Vault Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="save-vault-checkbox"
            checked={saveToVault}
            onChange={(e) => setSaveToVault(e.target.checked)}
            className="rounded-xs border-border bg-secondary text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
          <label
            htmlFor="save-vault-checkbox"
            className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
          >
            Guardar esta contraseña en mi Vault cifrado para futuras conexiones 🛡️
          </label>
        </div>

        {/* Actions */}
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
            <Lock className="h-4 w-4" />
            Conectar
          </button>
        </div>
      </form>
    </Modal>
  );
};
