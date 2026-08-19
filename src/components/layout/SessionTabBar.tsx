import React from "react";
import { Connection, Protocol } from "@/types/connection";
import {
  Terminal,
  Monitor,
  FolderTree,
  Globe,
  Tv,
  X,
  LayoutDashboard,
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
}

export const SessionTabBar: React.FC<SessionTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}) => {
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
        return <FolderTree className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <Terminal className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center bg-[#090E17] border-b border-border/80 px-2 pt-1 gap-1 overflow-x-auto select-none scrollbar-none shrink-0 h-10">
      {/* Dashboard / Main View Tab */}
      <button
        onClick={() => onSelectTab(null)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-t border-x ${
          activeTabId === null
            ? "bg-card text-foreground border-border border-b-transparent shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent"
        }`}
        title="Panel Principal de Conexiones"
      >
        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
        <span>Conexiones</span>
      </button>

      {/* Dynamic Session Tabs */}
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-t border-x max-w-[200px] ${
              isActive
                ? "bg-card text-foreground border-border border-b-transparent shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent"
            }`}
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
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100"
              title="Cerrar pestaña (Ctrl+W)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
