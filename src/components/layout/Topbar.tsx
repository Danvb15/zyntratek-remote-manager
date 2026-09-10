import React, { useEffect } from "react";
import { Search, Plus, RefreshCw, HelpCircle, Database, Palette } from "lucide-react";
import { Protocol } from "@/types/connection";

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  protocolFilter: Protocol | "ALL";
  onProtocolFilterChange: (p: Protocol | "ALL") => void;
  onOpenCreateConnectionModal: () => void;
  onRefresh: () => void;
  onOpenOnboarding?: () => void;
  onOpenBackup?: () => void;
  onOpenThemeSelector?: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  onSearchChange,
  protocolFilter,
  onProtocolFilterChange,
  onOpenCreateConnectionModal,
  onRefresh,
  onOpenOnboarding,
  onOpenBackup,
  onOpenThemeSelector,
  searchInputRef,
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl+N or Cmd+N -> New Connection
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onOpenCreateConnectionModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenCreateConnectionModal, searchInputRef]);

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-xs px-3 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 select-none">
      {/* Global Search Input */}
      <div className="relative flex-1 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchInputRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder="Buscar conexiones por nombre, host, usuario..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-10 sm:pr-12 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
        />
        <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 bg-background border border-border rounded-md text-[10px] font-mono text-muted-foreground">
          <span>⌘</span><span>K</span>
        </div>
      </div>

      {/* Action Controls & Protocol Selector */}
      <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
        {/* Protocol Quick Selector (Scrollable on mobile) */}
        <div className="flex items-center p-0.5 bg-secondary border border-border rounded-xl text-xs font-medium shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onProtocolFilterChange("ALL")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "ALL" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onProtocolFilterChange("SSH")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "SSH" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SSH
          </button>
          <button
            onClick={() => onProtocolFilterChange("RDP")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "RDP" ? "bg-blue-500/20 text-blue-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            RDP
          </button>
          <button
            onClick={() => onProtocolFilterChange("WEB")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "WEB" ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            WEB
          </button>
          <button
            onClick={() => onProtocolFilterChange("VNC")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "VNC" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            VNC
          </button>
          <button
            onClick={() => onProtocolFilterChange("SFTP")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors shrink-0 ${
              protocolFilter === "SFTP" ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SFTP
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Backup / Export Button */}
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="p-1.5 sm:p-2 border border-border bg-secondary text-muted-foreground hover:text-emerald-400 rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Copia de Seguridad (.zyntra)"
            >
              <Database className="h-4 w-4 text-emerald-400" />
              <span className="hidden md:inline">Respaldo</span>
            </button>
          )}

          {/* Theme Selector Button */}
          {onOpenThemeSelector && (
            <button
              onClick={onOpenThemeSelector}
              className="p-1.5 sm:p-2 border border-border bg-secondary text-muted-foreground hover:text-cyan-400 rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Personalizar Tema Visual (Atajo)"
            >
              <Palette className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Tema</span>
            </button>
          )}

          {/* Help / Guía Button */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="p-1.5 sm:p-2 border border-border bg-secondary text-muted-foreground hover:text-primary rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Guía de Inicio Rápido"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="hidden md:inline">Guía</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-1.5 sm:p-2 border border-border bg-secondary text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
            title="Recargar conexiones"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* New Connection Button (Desktop only, mobile has FAB) */}
          <button
            onClick={onOpenCreateConnectionModal}
            className="hidden sm:flex px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nueva Conexión
            <span className="ml-1 opacity-60 font-mono text-[10px]">⌘N</span>
          </button>
        </div>
      </div>
    </header>
  );
};
