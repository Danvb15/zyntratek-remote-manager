import React, { useState, useEffect } from "react";
import {
  Monitor,
  Maximize2,
  Minimize2,
  XCircle,
  RefreshCw,
  Keyboard,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Connection } from "../../types/connection";

interface VncViewerComponentProps {
  connection: Connection;
  onClose: () => void;
}

export const VncViewerComponent: React.FC<VncViewerComponentProps> = ({
  connection,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scaleMode, setScaleMode] = useState<"fit" | "original">("fit");
  const [latency, setLatency] = useState(18);
  const [connectedTime, setConnectedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Latency & Connection Uptime Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setConnectedTime((prev) => prev + 1);
      setLatency(15 + Math.floor(Math.random() * 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendCtrlAltDel = () => {
    setStatusMessage("Enviando combinación Ctrl+Alt+Del a la sesión VNC...");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRefresh = () => {
    setStatusMessage("Refrescando cuadro de pantalla VNC...");
    setTimeout(() => setStatusMessage(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1120] text-slate-100 font-sans rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F172A] border-b border-slate-800/80 select-none">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">{connection.name}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                VNC RFB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {connection.username}@{connection.host}:{connection.port || 5900}
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px]">RFB 3.8 Sec</span>
            </div>
            <div className="flex items-center space-x-1 text-sky-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[11px]">{latency} ms</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Uptime: {formatUptime(connectedTime)}
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
            <button
              onClick={handleSendCtrlAltDel}
              title="Enviar Ctrl+Alt+Del"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              onClick={() => setScaleMode(scaleMode === "fit" ? "original" : "fit")}
              title={scaleMode === "fit" ? "Escala Real (1:1)" : "Ajustar a la Pantalla"}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors text-xs font-mono font-semibold px-2"
            >
              {scaleMode === "fit" ? "AUTO" : "1:1"}
            </button>

            <button
              onClick={handleRefresh}
              title="Refrescar Pantalla VNC"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Desconectar</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Interactive Remote Display Viewport */}
      <div className="flex-1 relative bg-[#060B14] flex items-center justify-center overflow-hidden p-4">
        <div
          className={`relative border border-slate-800 rounded-lg shadow-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center transition-all ${
            scaleMode === "fit" ? "w-full h-full max-h-full max-w-full" : "w-[1280px] h-[720px]"
          }`}
        >
          {/* Simulated VNC Desktop Canvas Surface */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0D1527] to-slate-950 flex flex-col items-center justify-center p-8 select-none">
            {/* Desktop Mock Background Graphic */}
            <div className="w-24 h-24 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5 animate-pulse">
              <Monitor className="w-12 h-12" />
            </div>

            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              Sesión VNC Activa - {connection.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-6 max-w-md text-center">
              Transmitiendo buffer de pantalla remoto vía protocolo VNC RFB a {connection.host}:{connection.port || 5900}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Codificación</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">Tight / ZRLE</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Profundidad</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">24-bit TrueColor</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compresión</span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">Nivel 6 (JPEG)</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">FPS Promedio</span>
                <span className="text-xs font-semibold text-sky-400 font-mono">60 FPS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
