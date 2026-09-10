import React, { useEffect } from "react";
import { Search, Plus, RefreshCw, HelpCircle, Database, Sun, Moon } from "lucide-react";
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
    <header className="border-b border-border bg-card px-3 sm:px-6 py-2.5 sm:py-0 sm:h-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 select-none">
      {/* Global Search Input */}
      <div className="relative flex-1 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchInputRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder="Buscar conexiones por nombre, host, usuario..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-md pl-9 pr-10 sm:pr-12 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-hidden transition-colors"
        />
        <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono text-muted-foreground">
          <span>⌘</span><span>K</span>
        </div>
      </div>

      {/* Action Controls & Protocol Selector */}
      <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
        {/* Protocol Quick Selector */}
        <div className="flex items-center p-0.5 bg-secondary border border-border rounded-md text-xs font-medium shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onProtocolFilterChange("ALL")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "ALL" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onProtocolFilterChange("SSH")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "SSH" ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SSH
          </button>
          <button
            onClick={() => onProtocolFilterChange("RDP")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "RDP" ? "bg-card text-blue-600 dark:text-blue-400 font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            RDP
          </button>
          <button
            onClick={() => onProtocolFilterChange("WEB")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "WEB" ? "bg-card text-purple-600 dark:text-purple-400 font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            WEB
          </button>
          <button
            onClick={() => onProtocolFilterChange("VNC")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "VNC" ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            VNC
          </button>
          <button
            onClick={() => onProtocolFilterChange("SFTP")}
            className={`px-2.5 sm:px-3 py-1 rounded transition-colors shrink-0 ${
              protocolFilter === "SFTP" ? "bg-card text-teal-600 dark:text-teal-400 font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SFTP
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Backup Button */}
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="p-1.5 sm:p-2 border border-border bg-card text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-secondary transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Copia de Seguridad (.zyntra)"
            >
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Respaldo</span>
            </button>
          )}

          {/* Theme Selector Button (Sun / Moon) */}
          {onOpenThemeSelector && (
            <button
              onClick={onOpenThemeSelector}
              className="p-1.5 sm:p-2 border border-border bg-card text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Personalizar Tema (Claro / Oscuro)"
            >
              <Sun className="h-4 w-4 block dark:hidden text-amber-500" />
              <Moon className="h-4 w-4 hidden dark:block text-blue-400" />
              <span className="hidden sm:inline">Tema</span>
            </button>
          )}

          {/* Help Button */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="p-1.5 sm:p-2 border border-border bg-card text-muted-foreground hover:text-primary rounded-md hover:bg-secondary transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Guía de Inicio Rápido"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="hidden md:inline">Guía</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-1.5 sm:p-2 border border-border bg-card text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
            title="Recargar conexiones"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* New Connection Button */}
          <button
            onClick={onOpenCreateConnectionModal}
            className="hidden sm:flex px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors items-center gap-1.5 shadow-2xs shrink-0"
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
