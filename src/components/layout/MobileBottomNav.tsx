import React from "react";
import {
  Server,
  KeyRound,
  Layers,
  Activity,
  Plus,
} from "lucide-react";

interface MobileBottomNavProps {
  currentView: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS" | "MONITORING";
  onSelectView: (view: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS" | "MONITORING") => void;
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xs md:hidden transition-colors">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* 1. Conexiones */}
        <button
          onClick={() => onSelectView("CONNECTIONS")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-md transition-all ${
            currentView === "CONNECTIONS" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <Server className="h-4.5 w-4.5 mb-0.5" />
            {currentView === "CONNECTIONS" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Conexiones</span>
        </button>

        {/* 2. Monitoreo en Vivo (NOC) */}
        <button
          onClick={() => onSelectView("MONITORING")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-md transition-all ${
            currentView === "MONITORING" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <Activity className="h-4.5 w-4.5 mb-0.5" />
            {currentView === "MONITORING" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Monitoreo</span>
        </button>

        {/* Botón Central FAB (+) */}
        <div className="flex items-center justify-center -top-4 relative px-1">
          <button
            onClick={onOpenCreateModal}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-transform border border-primary/20"
            title="Nueva Conexión"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 3. Bóveda */}
        <button
          onClick={() => onSelectView("CREDENTIALS")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-xl transition-all ${
            currentView === "CREDENTIALS" && activeTabId === null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <KeyRound className="h-4.5 w-4.5 mb-0.5" />
            {currentView === "CREDENTIALS" && activeTabId === null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Bóveda</span>
        </button>

        {/* 4. Sesiones Activas */}
        <button
          onClick={onOpenSessionsModal}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 rounded-xl transition-all ${
            activeTabId !== null
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <Layers className="h-4.5 w-4.5 mb-0.5" />
            {activeSessionCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-2xs">
                {activeSessionCount}
              </span>
            )}
            {activeTabId !== null && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Sesiones</span>
        </button>
      </div>
    </nav>
  );
};
