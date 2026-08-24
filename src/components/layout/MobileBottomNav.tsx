import React from "react";
import {
  Server,
  KeyRound,
  Layers,
  Settings as SettingsIcon,
  Plus,
} from "lucide-react";

interface MobileBottomNavProps {
  currentView: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS";
  onSelectView: (view: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS") => void;
  activeSessionCount: number;
  activeTabId: string | null;
  onOpenSessionsModal: () => void;
  onOpenCreateModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  activeSessionCount,
  activeTabId,
  onOpenSessionsModal,
  onOpenCreateModal,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B132B]/95 backdrop-blur-lg border-t border-border/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:hidden">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* 1. Conexiones */}
        <button
          onClick={() => onSelectView("CONNECTIONS")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all ${
            currentView === "CONNECTIONS" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <Server className="h-5 w-5 mb-0.5" />
            {currentView === "CONNECTIONS" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Conexiones</span>
        </button>

        {/* 2. Bóveda */}
        <button
          onClick={() => onSelectView("CREDENTIALS")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all ${
            currentView === "CREDENTIALS" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <KeyRound className="h-5 w-5 mb-0.5" />
            {currentView === "CREDENTIALS" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Bóveda</span>
        </button>

        {/* Botón Central FAB (+) */}
        <div className="flex items-center justify-center -top-4 relative px-1">
          <button
            onClick={onOpenCreateModal}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 via-primary to-blue-500 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 transition-transform"
            title="Nueva Conexión"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 3. Sesiones Activas */}
        <button
          onClick={onOpenSessionsModal}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all ${
            activeTabId !== null
              ? "text-cyan-400 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <Layers className="h-5 w-5 mb-0.5" />
            {activeSessionCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-cyan-500 text-slate-950 font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {activeSessionCount}
              </span>
            )}
            {activeTabId !== null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Sesiones</span>
        </button>

        {/* 4. Ajustes */}
        <button
          onClick={() => onSelectView("SETTINGS")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all ${
            currentView === "SETTINGS" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <SettingsIcon className="h-5 w-5 mb-0.5" />
            {currentView === "SETTINGS" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};
