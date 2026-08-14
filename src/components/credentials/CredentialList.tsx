import React from "react";
import { CredentialMetadata } from "@/types/credential";
import { Key, Edit2, Trash2, Shield, Plus } from "lucide-react";

interface CredentialListProps {
  credentials: CredentialMetadata[];
  loading: boolean;
  onEdit: (cred: CredentialMetadata) => void;
  onDelete: (cred: CredentialMetadata) => void;
  onCreateNew: () => void;
}

export const CredentialList: React.FC<CredentialListProps> = ({
  credentials,
  loading,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-card/40 border border-border/50 rounded-xl p-4 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-secondary rounded-lg" />
              <div className="h-4 bg-secondary rounded-md w-48" />
            </div>
            <div className="h-4 bg-secondary rounded-md w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card/30 space-y-4">
        <div className="h-16 w-16 bg-secondary/80 text-muted-foreground rounded-2xl flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-semibold text-base text-foreground">Vault de Credenciales Vacío</h3>
          <p className="text-xs text-muted-foreground">
            Aún no has guardado credenciales en el almacén seguro del sistema operativo.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Guardar Primera Credencial
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre de Credencial</th>
            <th className="px-4 py-3 font-semibold">Tipo</th>
            <th className="px-4 py-3 font-semibold">Proveedor Vault</th>
            <th className="px-4 py-3 font-semibold">Usuario (Hint)</th>
            <th className="px-4 py-3 font-semibold">Secreto</th>
            <th className="px-4 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {credentials.map((cred) => (
            <tr key={cred.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-4 py-3.5 font-medium text-foreground flex items-center gap-2.5">
                <Key className="h-4 w-4 text-primary shrink-0" />
                <span>{cred.name}</span>
              </td>
              <td className="px-4 py-3.5 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono bg-secondary text-secondary-foreground border border-border">
                  {cred.credentialType}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <Shield className="h-3.5 w-3.5" />
                  {cred.provider}
                </span>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-foreground">
                {cred.usernameHint || <span className="text-muted-foreground italic">No especificado</span>}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                •••••••• (Custodiado en OS Keyring)
              </td>
              <td className="px-4 py-3.5 text-right space-x-1">
                <button
                  onClick={() => onEdit(cred)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                  title="Editar metadatos"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(cred)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Eliminar credencial del Keyring"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
