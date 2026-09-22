import React, { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Connection } from "@/types/connection";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  Lock,
  Globe,
  AppWindow,
  Sparkles,
  Layers,
  X,
} from "lucide-react";

interface WebConsoleComponentProps {
  connection: Connection;
  onBack: () => void;
  onOpenSessions?: () => void;
  activeSessionCount?: number;
}

export const WebConsoleComponent: React.FC<WebConsoleComponentProps> = ({
  connection,
  onBack,
  onOpenSessions,
  activeSessionCount = 1,
}) => {
  const isMobile = useIsMobile();
  const [showBanner, setShowBanner] = useState<boolean>(!isMobile);

  // Construct initial URL
  const getInitialUrl = () => {
    const host = connection.host;
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host;
    }
    const isHttps =
      connection.port === 443 ||
      connection.port === 8006 ||
      connection.port === 8443 ||
      connection.port === 9443 ||
      connection.port === 5001;

    const scheme = isHttps ? "https://" : "http://";
    const portSuffix =
      (isHttps && connection.port === 443) || (!isHttps && connection.port === 80)
        ? ""
        : `:${connection.port}`;

    return `${scheme}${host}${portSuffix}`;
  };

  const [currentUrl, setCurrentUrl] = useState<string>(getInitialUrl());
  const [inputUrl, setInputUrl] = useState<string>(getInitialUrl());
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isSecure = currentUrl.startsWith("https://");

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    setCurrentUrl(url);
    setInputUrl(url);
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  };

  const [openingNative, setOpeningNative] = useState(false);

  const handleOpenNativeWindow = async () => {
    setOpeningNative(true);
    try {
      await invoke("open_web_console_window", {
        url: currentUrl,
        title: `${connection.name} (${connection.host}) - Zyntratek Remote Manager`,
      });
    } catch (err) {
      console.error("Error al abrir ventana nativa:", err);
    } finally {
      setOpeningNative(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground select-none overflow-hidden">
      {/* Top Controls Bar */}
      <div className="h-12 md:h-14 border-b border-border bg-card/90 backdrop-blur-xs px-2.5 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-xs font-semibold hover:bg-secondary/80 text-foreground transition-all shrink-0 active:scale-95 shadow-2xs"
          title="Volver al Panel Principal (mantiene la consola activa en segundo plano)"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
          <span>Panel</span>
        </button>

        {/* Mobile Title or Desktop Address Bar */}
        {isMobile ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1 px-1">
            <div className="p-1 rounded-md bg-secondary/80 border border-border shrink-0">
              {isSecure ? (
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0 truncate">
              <div className="font-semibold text-xs text-foreground truncate leading-tight">
                {connection.name}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate leading-tight">
                {currentUrl}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleNavigate} className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <div
                className="absolute left-3 flex items-center gap-1"
                title={isSecure ? "Conexión Segura HTTPS" : "Conexión Estándar HTTP"}
              >
                {isSecure ? (
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl pl-9 pr-20 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              <span
                className={`absolute right-2.5 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isSecure
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {isSecure ? "HTTPS" : "HTTP"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 border border-border bg-secondary text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
              title="Recargar Consola Web"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isMobile && (
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 border border-border bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors active:scale-95"
              title="Recargar Consola Web"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Desktop-only Native Window Launcher */}
          {!isMobile && (
            <button
              onClick={handleOpenNativeWindow}
              disabled={openingNative}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 shrink-0"
              title="Abrir consola en ventana nativa dedicada sin restricciones X-Frame-Options"
            >
              <AppWindow className="h-4 w-4" />
              <span>{openingNative ? "Abriendo..." : "Abrir Ventana Nativa"}</span>
            </button>
          )}

          {/* External Browser Launch Button */}
          <button
            onClick={handleOpenExternal}
            className="p-1.5 sm:px-3 sm:py-1.5 border border-border bg-secondary text-foreground text-xs font-semibold rounded-lg sm:rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Abrir consola en navegador web del sistema (Chrome/Edge)"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Navegador</span>
          </button>

          {/* Mobile Sessions Switcher Button */}
          {onOpenSessions && (
            <button
              onClick={onOpenSessions}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-semibold shrink-0 hover:bg-primary/25 active:scale-95 transition-all shadow-2xs"
              title="Ver todas las sesiones activas"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{activeSessionCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* SSL / Self-Signed Certificate Notice Banner */}
      {showBanner && (
        <div className="bg-primary/10 border-b border-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between text-xs text-foreground font-sans shrink-0">
          <div className="flex items-center gap-2 truncate mr-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] sm:text-xs truncate text-muted-foreground">
              ¿No carga por certificados o X-Frame? Toca <button onClick={handleOpenExternal} className="text-primary font-bold underline">Abrir en Navegador</button>
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded shrink-0"
            title="Ocultar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Web Console Embedded Frame & Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-background flex flex-col items-center justify-center">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={currentUrl}
          title={`Consola Web - ${connection.name}`}
          className="w-full h-full border-0 select-none"
          allow="fullscreen; clipboard-read; clipboard-write; camera; microphone"
        />

      </div>
    </div>
  );
};

