import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import { Connection } from "@/types/connection";
import { sshService, SshEventData } from "@/services/tauri/ssh";
import { credentialService } from "@/services/tauri/credentials";
import { connectionService } from "@/services/tauri/connections";
import { InteractivePasswordModal } from "./InteractivePasswordModal";
import { SnippetDrawer } from "./SnippetDrawer";
import { useTerminalSettings } from "@/hooks/useTerminalSettings";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TERMINAL_THEMES } from "@/types/theme";
import { MobileTerminalKeypad } from "./MobileTerminalKeypad";
import { Terminal as TerminalIcon, Power, ArrowLeft, KeyRound, Zap, Layers } from "lucide-react";

interface SshTerminalComponentProps {
  connection: Connection;
  onBack: () => void;
  onOpenSessions?: () => void;
  activeSessionCount?: number;
}

export const SshTerminalComponent: React.FC<SshTerminalComponentProps> = ({
  connection,
  onBack,
  onOpenSessions,
  activeSessionCount = 1,
}) => {
  const { settings } = useTerminalSettings();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR">("CONNECTING");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState<boolean>(false);

  const isMobile = useIsMobile();
  const [mobileFontSize, setMobileFontSize] = useState<number>(() => {
    return window.innerWidth < 768 ? 12 : settings.fontSize;
  });

  const handleSendMobileKey = async (key: string) => {
    if (!sessionIdRef.current || status !== "CONNECTED") return;
    try {
      const encoded = new TextEncoder().encode(key);
      await sshService.sendInput(sessionIdRef.current, encoded);
    } catch (err) {
      console.error("Error enviando tecla a la sesión SSH:", err);
    }
  };

  const handleZoom = (delta: number) => {
    setMobileFontSize((prev) => {
      const next = Math.min(24, Math.max(10, prev + delta));
      if (xtermRef.current) {
        xtermRef.current.options.fontSize = next;
        fitAddonRef.current?.fit();
      }
      return next;
    });
  };

  const startConnectionSession = useCallback(
    async (manualPass?: string) => {
      const term = xtermRef.current;
      if (!term) return;

      if (manualPass) {
        term.writeln(`\x1b[36m[Zyntratek Remote Manager]\x1b[0m Re-intentando autenticación con contraseña ingresada...`);
      } else {
        term.writeln(`\x1b[36m[Zyntratek Remote Manager]\x1b[0m Iniciando sesión SSH con \x1b[1m${connection.username}@${connection.host}:${connection.port}\x1b[0m...`);
      }

      setStatus("CONNECTING");
      const cols = term.cols || 80;
      const rows = term.rows || 24;

      try {
        const id = await sshService.startSession(
          connection.id,
          cols,
          rows,
          (evt: SshEventData) => {
            if (evt.type === "output") {
              const rawBytes = new Uint8Array(evt.payload as number[]);
              term.write(rawBytes);
            } else if (evt.type === "status") {
              const newStatus = evt.payload as "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";
              setStatus(newStatus);
              if (newStatus === "CONNECTED") {
                term.writeln("\r\n\x1b[32m[Conectado al Servidor SSH]\x1b[0m\r\n");
                setShowAuthModal(false);
              }
            } else if (evt.type === "error") {
              const msg = evt.payload as string;
              setStatus("ERROR");
              term.writeln(`\r\n\x1b[31m[Error SSH]: ${msg}\x1b[0m\r\n`);
              if (msg.includes("Autenticación") || msg.includes("rechazada") || msg.includes("sin credenciales")) {
                setShowAuthModal(true);
              }
            } else if (evt.type === "exit") {
              setStatus("DISCONNECTED");
              term.writeln("\r\n\x1b[33m[Sesión SSH finalizada por el host remoto]\x1b[0m\r\n");
            }
          },
          manualPass
        );
        sessionIdRef.current = id;
      } catch (err: unknown) {
        const msg = (err as Error).message || "Fallo al iniciar sesión SSH";
        setStatus("ERROR");
        term.writeln(`\r\n\x1b[31m[Fallo de Conexión]: ${msg}\x1b[0m\r\n`);
        if (
          msg.includes("Autenticación") ||
          msg.includes("rechazada") ||
          msg.includes("sin credenciales") ||
          msg.includes("Vault") ||
          msg.includes("almacén") ||
          msg.includes("Credencial")
        ) {
          setShowAuthModal(true);
        }

      }
    },
    [connection]
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize xterm.js Terminal with customized theme & font settings
    const activeTheme = TERMINAL_THEMES[settings.themeName]?.theme || TERMINAL_THEMES.zyntratek.theme;

    const term = new XTerm({
      cursorBlink: settings.cursorBlink,
      cursorStyle: settings.cursorStyle,
      fontSize: isMobile ? mobileFontSize : settings.fontSize,
      fontFamily: settings.fontFamily,
      scrollback: settings.scrollback,
      theme: activeTheme,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Start SSH Session
    startConnectionSession();

    // 3. User Input Stream (Frontend -> Rust -> SSH Server PTY)
    const dataDisposable = term.onData((data) => {
      if (sessionIdRef.current) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        sshService.sendInput(sessionIdRef.current, bytes);
      }
    });

    // 4. Container Window Resize Listener
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current && sessionIdRef.current) {
        fitAddonRef.current.fit();
        const c = xtermRef.current.cols;
        const r = xtermRef.current.rows;
        sshService.resizePty(sessionIdRef.current, c, r);
      }
    };
    window.addEventListener("resize", handleResize);

    // 5. Cleanup on unmount or navigation
    return () => {
      dataDisposable.dispose();
      window.removeEventListener("resize", handleResize);
      if (sessionIdRef.current) {
        sshService.disconnect(sessionIdRef.current);
      }
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, startConnectionSession]);

  const handleDisconnect = () => {
    if (sessionIdRef.current) {
      sshService.disconnect(sessionIdRef.current);
      setStatus("DISCONNECTED");
      if (xtermRef.current) {
        xtermRef.current.writeln("\r\n\x1b[33m[Desconectado manualmente por el usuario]\x1b[0m\r\n");
      }
    }
  };

  const handleInteractiveConnect = async (password: string, saveToVault: boolean) => {
    if (saveToVault) {
      try {
        const cred = await credentialService.create({
          name: `Password (${connection.name})`,
          credentialType: "Password",
          secret: password,
          usernameHint: connection.username,
        });
        await connectionService.update(connection.id, {
          credentialId: cred.id,
        });
        if (xtermRef.current) {
          xtermRef.current.writeln(`\x1b[32m[Vault]\x1b[0m Contraseña guardada de forma segura en tu almacén OS Keyring y vinculada a la conexión.\r\n`);
        }
      } catch (e) {
        console.error("Error guardando credencial en Vault:", e);
      }
    }

    await startConnectionSession(password);
  };

  const handleRunSnippet = async (command: string) => {
    if (!sessionIdRef.current || status !== "CONNECTED") return;
    try {
      const encoded = new TextEncoder().encode(`${command}\n`);
      await sshService.sendInput(sessionIdRef.current, encoded);
    } catch (err) {
      console.error("Error sending snippet to SSH session:", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background rounded-xl border border-border/80 overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 bg-card/80 border-b border-border/80 select-none shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0 active:scale-95"
            title="Volver al Panel Principal (mantiene la sesión SSH activa en segundo plano)"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span className="hidden xs:inline">Panel</span>
          </button>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <TerminalIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs text-foreground truncate">{connection.name}</span>
            <span className="font-mono text-xs text-muted-foreground hidden md:inline truncate">
              ({connection.username}@{connection.host}:{connection.port})
            </span>
          </div>
        </div>

        {/* Status indicator, Snippets toggle, Sessions Switcher & Disconnect button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Botón de Comandos Rápidos / Snippets */}
          <button
            onClick={() => setIsSnippetDrawerOpen((prev) => !prev)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 shadow-2xs shrink-0 ${
              isSnippetDrawerOpen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border/80"
            }`}
            title="Comandos Rápidos y Snippets"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Snippets</span>
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

          {status === "ERROR" && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contraseña</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                status === "CONNECTED"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "CONNECTING"
                  ? "bg-amber-400 animate-ping"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-mono text-muted-foreground uppercase hidden sm:inline">
              {status}
            </span>
          </div>

          <button
            onClick={handleDisconnect}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
            title="Desconectar y cerrar"
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Terminal Viewport + Snippet Drawer Layout */}
      <div className="flex-1 flex overflow-hidden bg-[#090d16] relative">
        <div className="flex-1 p-2 h-full overflow-hidden">
          <div ref={terminalRef} className="h-full w-full" />
        </div>

        {/* Snippet Drawer Panel */}
        <SnippetDrawer
          isOpen={isSnippetDrawerOpen}
          onClose={() => setIsSnippetDrawerOpen(false)}
          onRunSnippet={handleRunSnippet}
        />
      </div>

      {/* Mobile Virtual Keypad Bar */}
      {isMobile && status === "CONNECTED" && (
        <MobileTerminalKeypad
          onSendKey={handleSendMobileKey}
          onZoomIn={() => handleZoom(1)}
          onZoomOut={() => handleZoom(-1)}
          onOpenSnippets={() => setIsSnippetDrawerOpen(true)}
        />
      )}

      {/* Interactive Password Modal */}
      <InteractivePasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConnect={handleInteractiveConnect}
        connectionName={connection.name}
        username={connection.username}
        host={connection.host}
      />
    </div>
  );
};
