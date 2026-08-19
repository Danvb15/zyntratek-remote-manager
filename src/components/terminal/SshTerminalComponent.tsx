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
import { TERMINAL_THEMES } from "@/types/theme";
import { Terminal as TerminalIcon, Power, ArrowLeft, KeyRound, Zap } from "lucide-react";

interface SshTerminalComponentProps {
  connection: Connection;
  onBack: () => void;
}

export const SshTerminalComponent: React.FC<SshTerminalComponentProps> = ({
  connection,
  onBack,
}) => {
  const { settings } = useTerminalSettings();
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR">("CONNECTING");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);

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
      fontSize: settings.fontSize,
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
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/80 border-b border-border/80 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-xs text-foreground">{connection.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              ({connection.username}@{connection.host}:{connection.port})
            </span>
          </div>
        </div>

        {/* Status indicator, Snippets toggle & Disconnect button */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Comandos Rápidos / Snippets */}
          <button
            onClick={() => setIsSnippetDrawerOpen((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-2xs ${
              isSnippetDrawerOpen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border/80"
            }`}
            title="Comandos Rápidos y Snippets"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Snippets</span>
          </button>

          {status === "ERROR" && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Ingresar Contraseña
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "CONNECTED"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "CONNECTING"
                  ? "bg-amber-400 animate-ping"
                  : status === "ERROR"
                  ? "bg-destructive"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {status}
            </span>
          </div>

          {status === "CONNECTED" && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Power className="h-3.5 w-3.5" />
              Desconectar
            </button>
          )}
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
