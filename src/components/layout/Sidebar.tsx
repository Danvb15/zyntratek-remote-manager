import React from "react";
import { Connection, Protocol } from "@/types/connection";
import { Folder } from "@/types/folder";
import { Tag } from "@/types/connection";
import { CredentialMetadata } from "@/types/credential";
import {
  Shield,
  Terminal,
  Monitor,
  Globe,
  Tv,
  FolderTree,
  Star,
  FolderPlus,
  Folder as FolderIcon,
  Tag as TagIcon,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  Layers,
} from "lucide-react";




interface SidebarProps {
  currentView: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS";
  onSelectView: (view: "CONNECTIONS" | "CREDENTIALS" | "SETTINGS") => void;
  connections: Connection[];
  credentials: CredentialMetadata[];
  folders: Folder[];
  tags: Tag[];
  protocolFilter: Protocol | "ALL";
  onSelectProtocolFilter: (p: Protocol | "ALL") => void;
  favoriteFilter: "ALL" | "FAVORITES";
  onSelectFavoriteFilter: (f: "ALL" | "FAVORITES") => void;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
  onOpenCreateFolderModal: () => void;
  onOpenCreateTagModal: () => void;
  onDeleteFolder: (id: string) => void;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  connections,
  credentials,
  folders,
  tags,
  protocolFilter,
  onSelectProtocolFilter,
  favoriteFilter,
  onSelectFavoriteFilter,
  selectedFolderId,
  onSelectFolder,
  selectedTagId,
  onSelectTag,
  onOpenCreateFolderModal,
  onOpenCreateTagModal,
  onDeleteFolder,
  onEditTag,
  onDeleteTag,
}) => {
  // Counters
  const totalCount = connections.length;
  const favoritesCount = connections.filter((c) => c.favorite).length;
  const sshCount = connections.filter((c) => c.protocol === "SSH").length;
  const rdpCount = connections.filter((c) => c.protocol === "RDP").length;
  const webCount = connections.filter((c) => c.protocol === "WEB").length;
  const vncCount = connections.filter((c) => c.protocol === "VNC").length;
  const sftpCount = connections.filter((c) => c.protocol === "SFTP").length;
  const vaultCount = credentials.length;






  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="Zyntratek Logo" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground">Zyntratek</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Remote Manager</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          v1.1.0
        </span>
      </div>


      {/* Navigation Links */}
      <div className="flex-1 p-3 space-y-5 overflow-y-auto">
        {/* Navigation Category */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Conexiones
          </div>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("ALL");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "ALL" && favoriteFilter === "ALL" && !selectedFolderId && !selectedTagId
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4" />
              <span>Todas las Conexiones</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectFavoriteFilter("FAVORITES");
              onSelectProtocolFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && favoriteFilter === "FAVORITES"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
              <span>Favoritos</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {favoritesCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("SSH");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "SSH" && favoriteFilter === "ALL"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>Sesiones SSH</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {sshCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("RDP");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "RDP" && favoriteFilter === "ALL"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Monitor className="h-4 w-4 text-blue-400" />
              <span>Sesiones RDP</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {rdpCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("WEB");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "WEB" && favoriteFilter === "ALL"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-purple-400" />
              <span>Consolas WEB</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {webCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("VNC");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "VNC" && favoriteFilter === "ALL"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tv className="h-4 w-4 text-amber-400" />
              <span>Sesiones VNC</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {vncCount}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("CONNECTIONS");
              onSelectProtocolFilter("SFTP");
              onSelectFavoriteFilter("ALL");
              onSelectFolder(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CONNECTIONS" && protocolFilter === "SFTP" && favoriteFilter === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderTree className="h-4 w-4 text-cyan-400" />
              <span>Archivos SFTP</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {sftpCount}
            </span>
          </button>




        </div>

        {/* Folders Category */}
        <div className="space-y-1">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Carpetas
            </span>
            <button
              onClick={onOpenCreateFolderModal}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-secondary transition-colors"
              title="Nueva carpeta"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {folders.length === 0 ? (
            <p className="px-3 py-1 text-[11px] text-muted-foreground italic">Sin carpetas creadas</p>
          ) : (
            folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              const count = connections.filter((c) => c.folderId === folder.id).length;
              return (
                <div key={folder.id} className="group relative flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectView("CONNECTIONS");
                      onSelectFolder(folder.id);
                      onSelectProtocolFilter("ALL");
                      onSelectFavoriteFilter("ALL");
                      onSelectTag(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg font-medium transition-colors pr-8 ${
                      isSelected
                        ? "bg-secondary text-foreground font-semibold border border-border"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
                  </button>

                  <button
                    onClick={() => onDeleteFolder(folder.id)}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded-md transition-opacity"
                    title="Eliminar carpeta"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Tags Category */}
        <div className="space-y-1">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Etiquetas
            </span>
            <button
              onClick={onOpenCreateTagModal}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-secondary transition-colors"
              title="Nueva etiqueta"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pt-1">
            {tags.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Sin etiquetas creadas</p>
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className="group relative inline-flex items-center"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (onEditTag) onEditTag(tag);
                    }}
                  >
                    <button
                      onClick={() => {
                        onSelectView("CONNECTIONS");
                        onSelectTag(isSelected ? null : tag.id);
                        onSelectProtocolFilter("ALL");
                        onSelectFavoriteFilter("ALL");
                        onSelectFolder(null);
                      }}
                      className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
                        isSelected ? "ring-2 ring-primary border-primary font-bold" : "opacity-85 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: `${tag.color}15`,
                        borderColor: `${tag.color}40`,
                        color: tag.color,
                      }}
                      title={`Clic para filtrar por "${tag.name}". Clic derecho o lápiz para editar.`}
                    >
                      <TagIcon className="h-3 w-3" />
                      <span>{tag.name}</span>

                      {/* Botones de Editar y Eliminar en hover */}
                      <span className="inline-flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditTag && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTag(tag);
                            }}
                            className="p-0.5 hover:bg-black/30 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Editar etiqueta"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </span>
                        )}
                        {onDeleteTag && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) {
                                onDeleteTag(tag.id);
                              }
                            }}
                            className="p-0.5 hover:bg-destructive/30 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Eliminar etiqueta"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security / Vault Category */}
        <div className="space-y-1 pt-2">
          <div className="px-3 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Seguridad
          </div>

          <button
            onClick={() => onSelectView("CREDENTIALS")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "CREDENTIALS"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4" />
              <span>Vault de Credenciales</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono">
              {vaultCount}
            </span>
          </button>

          <button
            onClick={() => onSelectView("SETTINGS")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
              currentView === "SETTINGS"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="h-4 w-4" />
              <span>Configuración</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
