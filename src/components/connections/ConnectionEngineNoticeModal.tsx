import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Connection } from "@/types/connection";
import { Monitor, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { rdpService } from "@/services/tauri/rdp";

interface ConnectionEngineNoticeModalProps {
  connection: Connection | null;
  onClose: () => void;
}

export const ConnectionEngineNoticeModal: React.FC<ConnectionEngineNoticeModalProps> = ({
  connection,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!connection) return null;

  const handleLaunchRdp = async () => {
    setLoading(true);
    setError(null);
    setStatusMsg("Iniciando sesión de Escritorio Remoto RDP...");

    try {
      await rdpService.startSession(connection.id);
      setStatusMsg("Cliente RDP nativo iniciado correctamente. Credencial temporal inyectada y monitoreada.");
    } catch (err: unknown) {
      const msg = (err as Error).message || "Fallo al iniciar el cliente RDP nativo";
      setError(msg);
      setStatusMsg(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!connection}
      onClose={onClose}
      title={`Conexión RDP - ${connection.name}`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <Monitor className="h-7 w-7 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-foreground">
              Lanzar Escritorio Remoto RDP
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La conexión utilizará el cliente nativo del sistema (<strong>mstsc.exe</strong> en Windows o <strong>FreeRDP</strong> en Linux/macOS). Las credenciales se inyectarán de forma segura sin exponerse en la línea de comandos.
            </p>
          </div>
        </div>

        <div className="p-3 bg-secondary/50 rounded-lg text-xs space-y-1.5 border border-border text-muted-foreground">
          <div className="flex justify-between">
            <span>Protocolo:</span>
            <span className="font-semibold text-foreground">{connection.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span>Host / Puerto:</span>
            <span className="font-mono text-foreground">{connection.host}:{connection.port}</span>
          </div>
          <div className="flex justify-between">
            <span>Usuario:</span>
            <span className="font-mono text-foreground">{connection.username}</span>
          </div>
          {connection.username.includes('\\') && (
            <div className="flex justify-between">
              <span>Dominio:</span>
              <span className="font-mono text-foreground">{connection.username.split('\\')[0]}</span>
            </div>
          )}

        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleLaunchRdp}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lanzando RDP...
              </>
            ) : (
              <>
                <Monitor className="h-3.5 w-3.5" />
                Iniciar RDP
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
