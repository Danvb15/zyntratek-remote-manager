import React, { useState, useRef, useEffect } from "react";
import { Connection, Protocol } from "@/types/connection";
import {
  Terminal,
  Monitor,
  FolderTree,
  Globe,
  Tv,
  X,
  LayoutDashboard,
  Plus,
  Search,
} from "lucide-react";

export interface SessionTab {
  id: string;
  connection: Connection;
  protocol: Protocol;
  title: string;
}

interface SessionTabBarProps {
  tabs: SessionTab[];
  activeTabId: string | null; // null represents the main Dashboard / Connection view
  onSelectTab: (tabId: string | null) => void;
  onCloseTab: (tabId: string) => void;
  connections?: Connection[];
  onConnect?: (connection: Connection, forceNewTab?: boolean) => void;
}

export const SessionTabBar: React.FC<SessionTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  connections = [],
  onConnect,
}) => {
  const [isNewTabMenuOpen, setIsNewTabMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNewTabMenuOpen(false);
      }
    };
    if (isNewTabMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isNewTabMenuOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isNewTabMenuOpen) {
        setIsNewTabMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNewTabMenuOpen]);

  const getProtocolIcon = (protocol: Protocol) => {
    switch (protocol) {
      case "SSH":
        return <Terminal className="h-3.5 w-3.5 text-emerald-400" />;
      case "RDP":
        return <Monitor className="h-3.5 w-3.5 text-blue-400" />;
      case "WEB":
        return <Globe className="h-3.5 w-3.5 text-purple-400" />;
      case "VNC":
        return <Tv className="h-3.5 w-3.5 text-amber-400" />;
      case "SFTP":
        return <FolderTree className="h-3.5 w-3.5 text-teal-400" />;
      default:
        return <Terminal className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const filteredConnections = connections.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.host.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.protocol.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex items-center bg-background border-b border-border px-2 pt-1 gap-1 overflow-x-auto select-none scrollbar-none shrink-0 h-10 transition-colors z-20">
      {/* Dashboard / Main View Tab */}
      <button
        onClick={() => onSelectTab(null)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-md text-xs font-semibold transition-all border-t border-x shrink-0 ${
          activeTabId === null
            ? "bg-card text-foreground border-border border-b-transparent shadow-2xs"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border-transparent"
        }`}
        title="Ir al Panel Principal (mantiene las sesiones activas de fondo)"
      >
        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
        <span>Panel</span>
        {tabs.length > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTabId === null
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {tabs.length}
          </span>
        )}
      </button>

      {/* Dynamic Session Tabs */}
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-t-md text-xs font-medium cursor-pointer transition-all border-t border-x max-w-[210px] shrink-0 ${
              isActive
                ? "bg-card text-foreground border-border border-b-transparent shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border-transparent"
            }`}
            title={`${tab.title} (${tab.protocol}) - Clic para ver pestaña`}
          >
            <div className="flex items-center gap-1.5 truncate">
              {getProtocolIcon(tab.protocol)}
              <span className="truncate">{tab.title}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100 ml-1"
              title="Cerrar y desconectar pestaña"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* Botón '+' para Nueva Pestaña / Conexión Rápida */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => {
            if (connections.length === 0) {
              onSelectTab(null);
            } else {
              setIsNewTabMenuOpen((prev) => !prev);
              setSearchQuery("");
            }
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center border border-transparent hover:border-border"
          title="Abrir nueva pestaña / Conexión rápida"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Dropdown de Conexión Rápida en Nueva Pestaña */}
        {isNewTabMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar conexión para abrir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1">
              <button
                onClick={() => {
                  onSelectTab(null);
                  setIsNewTabMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-2 transition-colors border border-primary/20 mb-1"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Ir al Panel de Conexiones</span>
              </button>

              {filteredConnections.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No se encontraron conexiones
                </div>
              ) : (
                filteredConnections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => {
                      if (onConnect) {
                        onConnect(conn, true);
                      }
                      setIsNewTabMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-secondary flex items-center justify-between gap-2 transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1 rounded bg-background border border-border">
                        {getProtocolIcon(conn.protocol)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {conn.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {conn.username ? `${conn.username}@` : ""}{conn.host}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border shrink-0">
                      {conn.protocol}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
