import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Connection } from "@/types/connection";
import { ServerHealthMetrics } from "@/types/health";
import { invoke } from "@tauri-apps/api/core";
import {
  Cpu,
  HardDrive,
  Clock,
  Wifi,
  Terminal,
  RefreshCw,
  Loader2,
  AlertCircle,
  Server,
  Layers,
} from "lucide-react";

interface ServerHealthModalProps {
  connection: Connection | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServerHealthModal: React.FC<ServerHealthModalProps> = ({
  connection,
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<ServerHealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPassword, setManualPassword] = useState<string>("");
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);

  const fetchHealth = useCallback(
    async (pass?: string) => {
      if (!connection) return;
      setLoading(true);
      setError(null);
      try {
        const res = await invoke<ServerHealthMetrics>("get_server_health", {
          connectionId: connection.id,
          manualPassword: pass || manualPassword || null,
        });
        setMetrics(res);
        setNeedsPassword(false);
      } catch (err: unknown) {
        const msg = (err as Error).message || "No se pudo obtener el estado del servidor";
        if (msg.includes("contraseña") || msg.includes("password") || msg.includes("Credencial no encontrada")) {
          setNeedsPassword(true);
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [connection, manualPassword]
  );

  useEffect(() => {
    if (isOpen && connection) {
      setMetrics(null);
      setError(null);
      setNeedsPassword(false);
      fetchHealth();
    }
  }, [isOpen, connection]);

  if (!connection) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monitor de Rendimiento en Vivo 📊"
    >
      <div className="space-y-4 text-foreground select-none">
        {/* Header Info */}
        <div className="flex items-center justify-between p-3 bg-[#080E1A] rounded-xl border border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{connection.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {connection.username}@{connection.host}:{connection.port}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {metrics && (
              <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <Wifi className="h-3 w-3" /> {metrics.pingMs} ms
              </span>
            )}
            <button
              onClick={() => fetchHealth()}
              disabled={loading}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-50"
              title="Refrescar métricas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error notification & Password form */}
        {error && (
          <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-xl text-xs text-destructive flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            {needsPassword && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="password"
                  placeholder="Ingresa la contraseña SSH..."
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-background border border-border rounded-lg text-foreground"
                />
                <button
                  onClick={() => fetchHealth(manualPassword)}
                  disabled={loading}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
                >
                  Conectar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner Skeleton */}
        {loading && !metrics && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs">Consultando métricas en tiempo real vía SSH...</p>
          </div>
        )}

        {/* Metrics Display Grid */}
        {metrics && (
          <div className="space-y-3">
            {/* CPU & RAM Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* RAM Usage Card */}
              <div className="p-3.5 bg-[#090F1C] border border-border/70 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    Memoria RAM
                  </span>
                  <span className="text-xs font-bold text-indigo-400">
                    {metrics.memoryPercent}%
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      metrics.memoryPercent > 85
                        ? "bg-rose-500"
                        : metrics.memoryPercent > 70
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${metrics.memoryPercent}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-muted-foreground flex justify-between">
                  <span>Usado: {metrics.memoryUsedMb} MB</span>
                  <span>Total: {metrics.memoryTotalMb} MB</span>
                </div>
              </div>

              {/* CPU Load Card */}
              <div className="p-3.5 bg-[#090F1C] border border-border/70 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    Carga CPU ({metrics.cpuCores} Núcleos)
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-cyan-300 mb-1">
                  {metrics.loadAverage}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Promedio de carga (1m, 5m, 15m)
                </div>
              </div>
            </div>

            {/* Disk & Uptime Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Disk Space Card */}
              <div className="p-3.5 bg-[#090F1C] border border-border/70 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                    Disco Raíz (/)
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {metrics.diskPercent}
                  </span>
                </div>
                <div className="text-xs font-mono text-foreground font-semibold mb-1">
                  {metrics.diskUsed} / {metrics.diskTotal}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Espacio usado / Capacidad total
                </div>
              </div>

              {/* Uptime Card */}
              <div className="p-3.5 bg-[#090F1C] border border-border/70 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    Tiempo Activo (Uptime)
                  </span>
                </div>
                <div className="font-mono text-xs text-emerald-300 font-semibold truncate mb-1">
                  {metrics.uptime}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Tiempo transcurrido desde el último reinicio
                </div>
              </div>
            </div>

            {/* Kernel & System Info */}
            <div className="p-3 bg-[#070B14] border border-border/60 rounded-xl flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Terminal className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate">Kernel: {metrics.osInfo}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
