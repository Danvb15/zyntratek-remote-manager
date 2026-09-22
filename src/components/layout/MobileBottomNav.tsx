import React from "react";
import {
  Server,
  KeyRound,
  Layers,
  Activity,
  Sliders,
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
    <>
      {/* Floating Action Button (FAB) for mobile, positioned above the nav */}
      {activeTabId === null && (currentView === "CONNECTIONS" || currentView === "CREDENTIALS") && (
        <button
          onClick={onOpenCreateModal}
          className="fixed bottom-[4.25rem] right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center border border-primary/20"
          title={currentView === "CREDENTIALS" ? "Nueva Credencial" : "Nueva Conexión"}
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xs md:hidden transition-colors">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          {/* 1. Conexiones */}
          <button
            onClick={() => onSelectView("CONNECTIONS")}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all ${
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
            <span className="text-[10px] tracking-tight mt-0.5 truncate">Conexiones</span>
          </button>

          {/* 2. Bóveda */}
          <button
            onClick={() => onSelectView("CREDENTIALS")}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all ${
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
            <span className="text-[10px] tracking-tight mt-0.5 truncate">Bóveda</span>
          </button>

          {/* 3. Monitoreo */}
          <button
            onClick={() => onSelectView("MONITORING")}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all ${
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
            <span className="text-[10px] tracking-tight mt-0.5 truncate">Monitoreo</span>
          </button>

          {/* 4. Sesiones Activas */}
          <button
            onClick={onOpenSessionsModal}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all ${
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
            <span className="text-[10px] tracking-tight mt-0.5 truncate">Sesiones</span>
          </button>

          {/* 5. Ajustes / Configuración */}
          <button
            onClick={() => onSelectView("SETTINGS")}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all ${
              currentView === "SETTINGS" && activeTabId === null
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <Sliders className="h-4.5 w-4.5 mb-0.5" />
              {currentView === "SETTINGS" && activeTabId === null && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate">Ajustes</span>
          </button>
        </div>
      </nav>
    </>
  );
};
