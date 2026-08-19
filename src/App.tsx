import { useState, useRef, useEffect } from "react";
import { useConnections } from "@/hooks/useConnections";
import { useCredentials } from "@/hooks/useCredentials";
import { useFolders } from "@/hooks/useFolders";
import { useTags } from "@/hooks/useTags";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SessionTabBar, SessionTab } from "@/components/layout/SessionTabBar";

import { ConnectionList } from "@/components/connections/ConnectionList";
import { ConnectionFormModal } from "@/components/connections/ConnectionFormModal";
import { ConnectionEngineNoticeModal } from "@/components/connections/ConnectionEngineNoticeModal";

import { CredentialList } from "@/components/credentials/CredentialList";
import { CredentialFormModal } from "@/components/credentials/CredentialFormModal";

import { CreateFolderModal } from "@/components/folders/CreateFolderModal";
import { CreateTagModal } from "@/components/tags/CreateTagModal";
import { EditTagModal } from "@/components/tags/EditTagModal";
import { ServerHealthModal } from "@/components/connections/ServerHealthModal";
import { BackupModal } from "@/components/backup/BackupModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { SshTerminalComponent } from "@/components/terminal/SshTerminalComponent";
import { WebConsoleComponent } from "@/components/console/WebConsoleComponent";
import { VncViewerComponent } from "@/components/vnc/VncViewerComponent";
import { SftpExplorerComponent } from "@/components/sftp/SftpExplorerComponent";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { Connection, CreateConnectionPayload, UpdateConnectionPayload, Tag } from "@/types/connection";
import { CredentialMetadata, CreateCredentialPayload, UpdateCredentialPayload } from "@/types/credential";
import { Filter, X } from "lucide-react";

export function App() {
  const [currentView, setCurrentView] = useState<"CONNECTIONS" | "CREDENTIALS" | "SETTINGS">("CONNECTIONS");

  // Onboarding Guide Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem("zyntratek_onboarding_seen") !== "true";
  });

  // Multi-Session Tabs State
  const [sessionTabs, setSessionTabs] = useState<SessionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null); // null = Dashboard / Connection Manager

  // Custom Hooks
  const {
    connections,
    loading: connLoading,
    error: connError,
    refresh: refreshConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    duplicateConnection,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    protocolFilter,
    setProtocolFilter,
    favoriteFilter,
    setFavoriteFilter,
    folderFilter,
    setFolderFilter,
    selectedTagId,
    setSelectedTagId,
  } = useConnections();

  const {
    credentials,
    loading: credLoading,
    error: credError,
    refresh: refreshCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
  } = useCredentials();

  const {
    folders,
    createFolder,
    deleteFolder,
  } = useFolders();

  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
  } = useTags();

  // Search input ref for Cmd+K shortcut focus
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Modals state
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<Connection | null>(null);
  const [noticeConnection, setNoticeConnection] = useState<Connection | null>(null);

  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CredentialMetadata | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<CredentialMetadata | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [healthConnection, setHealthConnection] = useState<Connection | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Connection Handler: Connect Button Action (Opens as a Tab)
  const handleConnect = (conn: Connection) => {
    if (conn.protocol === "RDP") {
      setNoticeConnection(conn);
      return;
    }

    // Check if an existing tab for this connection is already open
    const existingTab = sessionTabs.find((t) => t.connection.id === conn.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Create new active session tab
    const newTab: SessionTab = {
      id: `session-${conn.id}-${Date.now()}`,
      connection: conn,
      protocol: conn.protocol,
      title: conn.name,
    };

    setSessionTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
    setSessionTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        if (filtered.length > 0) {
          const index = prev.findIndex((t) => t.id === tabId);
          const nextTab = filtered[Math.max(0, index - 1)];
          setActiveTabId(nextTab.id);
        } else {
          setActiveTabId(null);
        }
      }
      return filtered;
    });
  };

  // Keyboard Shortcuts for Tabs (Ctrl+W to close, Ctrl+Tab to cycle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        if (activeTabId !== null) {
          e.preventDefault();
          handleCloseTab(activeTabId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Tab") {
        e.preventDefault();
        const tabList: (string | null)[] = [null, ...sessionTabs.map((t) => t.id)];
        const currentIndex = tabList.indexOf(activeTabId);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabList.length) % tabList.length
          : (currentIndex + 1) % tabList.length;
        setActiveTabId(tabList[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, sessionTabs]);

  // Connection Actions Handlers
  const handleOpenCreateConnection = () => {
    setEditingConnection(null);
    setIsConnModalOpen(true);
  };

  const handleOpenEditConnection = (conn: Connection) => {
    setEditingConnection(conn);
    setIsConnModalOpen(true);
  };

  const handleSaveConnection = async (payload: CreateConnectionPayload | UpdateConnectionPayload) => {
    if (editingConnection) {
      await updateConnection(editingConnection.id, payload as UpdateConnectionPayload);
    } else {
      await createConnection(payload as CreateConnectionPayload);
    }
  };

  const handleConfirmDeleteConnection = async () => {
    if (!deletingConnection) return;
    setActionLoading(true);
    try {
      await deleteConnection(deletingConnection.id);
      setDeletingConnection(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Credential Actions Handlers
  const handleOpenCreateCredential = () => {
    setEditingCredential(null);
    setIsCredModalOpen(true);
  };

  const handleOpenEditCredential = (cred: CredentialMetadata) => {
    setEditingCredential(cred);
    setIsCredModalOpen(true);
  };

  const handleSaveCredential = async (payload: CreateCredentialPayload | UpdateCredentialPayload) => {
    if (editingCredential) {
      await updateCredential(editingCredential.id, payload as UpdateCredentialPayload);
    } else {
      await createCredential(payload as CreateCredentialPayload);
    }
  };

  const handleConfirmDeleteCredential = async () => {
    if (!deletingCredential) return;
    setActionLoading(true);
    try {
      await deleteCredential(deletingCredential.id);
      setDeletingCredential(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Folder Actions Handlers
  const handleConfirmDeleteFolder = async () => {
    if (!deletingFolderId) return;
    setActionLoading(true);
    try {
      await deleteFolder(deletingFolderId);
      if (folderFilter === deletingFolderId) {
        setFolderFilter(null);
      }
      setDeletingFolderId(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Active filter helper label
  const activeFolder = folders.find((f) => f.id === folderFilter);
  const activeTag = tags.find((t) => t.id === selectedTagId);
  const hasActiveFilters = searchQuery || protocolFilter !== "ALL" || favoriteFilter !== "ALL" || folderFilter || selectedTagId;

  const clearAllFilters = () => {
    setSearchQuery("");
    setProtocolFilter("ALL");
    setFavoriteFilter("ALL");
    setFolderFilter(null);
    setSelectedTagId(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none font-sans antialiased">
      {/* Barra de Pestañas Superior (Multi-Session Tabs) */}
      <SessionTabBar
        tabs={sessionTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vista del Dashboard / Administrador de Conexiones */}
        <div
          className={`flex-1 flex h-full w-full overflow-hidden ${
            activeTabId === null ? "flex" : "hidden"
          }`}
        >
          {/* Sidebar */}
          <Sidebar
            currentView={currentView}
            onSelectView={setCurrentView}
            connections={connections}
            credentials={credentials}
            folders={folders}
            tags={tags}
            protocolFilter={protocolFilter}
            onSelectProtocolFilter={setProtocolFilter}
            favoriteFilter={favoriteFilter}
            onSelectFavoriteFilter={setFavoriteFilter}
            selectedFolderId={folderFilter}
            onSelectFolder={setFolderFilter}
            selectedTagId={selectedTagId}
            onSelectTag={setSelectedTagId}
            onOpenCreateFolderModal={() => setIsFolderModalOpen(true)}
            onOpenCreateTagModal={() => setIsTagModalOpen(true)}
            onDeleteFolder={(id) => setDeletingFolderId(id)}
            onEditTag={(tag) => setEditingTag(tag)}
            onDeleteTag={async (id) => {
              await deleteTag(id);
              refreshConnections();
            }}
          />

          {/* Main Dashboard Panel */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Topbar */}
            <Topbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              protocolFilter={protocolFilter}
              onProtocolFilterChange={setProtocolFilter}
              onOpenCreateConnectionModal={handleOpenCreateConnection}
              onRefresh={() => {
                refreshConnections();
                refreshCredentials();
              }}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              onOpenBackup={() => setIsBackupModalOpen(true)}
              searchInputRef={searchInputRef}
            />

            {/* View Content */}
            <main className="flex-1 p-6 overflow-y-auto">
              {currentView === "CONNECTIONS" && (
                <div className="space-y-4 max-w-7xl mx-auto">
                  {/* Header & Filter Breadcrumbs */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {favoriteFilter === "FAVORITES"
                          ? "Conexiones Favoritas ⭐"
                          : protocolFilter !== "ALL"
                          ? `Conexiones ${protocolFilter}`
                          : activeFolder
                          ? `Carpeta: ${activeFolder.name}`
                          : "Todas las Conexiones"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Conexiones remotas configuradas y custodiadas localmente.
                      </p>
                    </div>

                    {/* Filter chips bar */}
                    {hasActiveFilters && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <Filter className="h-3.5 w-3.5" /> Filtros activos:
                        </span>
                        {searchQuery && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                            Búsqueda: "{searchQuery}"
                          </span>
                        )}
                        {protocolFilter !== "ALL" && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                            {protocolFilter}
                          </span>
                        )}
                        {favoriteFilter === "FAVORITES" && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Favoritos
                          </span>
                        )}
                        {activeFolder && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            📁 {activeFolder.name}
                          </span>
                        )}
                        {activeTag && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: `${activeTag.color}20`,
                              borderColor: `${activeTag.color}50`,
                              color: activeTag.color,
                            }}
                          >
                            🏷️ {activeTag.name}
                          </span>
                        )}
                        <button
                          onClick={clearAllFilters}
                          className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1 ml-1"
                        >
                          <X className="h-3 w-3" /> Limpiar
                        </button>
                      </div>
                    )}
                  </div>

                  {connError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                      {connError}
                    </div>
                  )}

                  {/* Connections Grid */}
                  <ConnectionList
                    connections={connections}
                    loading={connLoading}
                    onConnect={handleConnect}
                    onEdit={handleOpenEditConnection}
                    onDuplicate={(conn) => {
                      duplicateConnection(conn.id);
                    }}
                    onDelete={(conn) => setDeletingConnection(conn)}
                    onToggleFavorite={toggleFavorite}
                    onCreateNew={handleOpenCreateConnection}
                    onCheckHealth={(conn) => setHealthConnection(conn)}
                  />
                </div>
              )}

              {currentView === "CREDENTIALS" && (
                <div className="space-y-6 max-w-6xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">Vault de Credenciales</h2>
                      <p className="text-xs text-muted-foreground">
                        Metadatos de credenciales registradas. Los secretos permanecen custodiados en el OS Keyring nativo.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateCredential}
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs"
                    >
                      Nueva Credencial
                    </button>
                  </div>

                  {credError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                      {credError}
                    </div>
                  )}

                  <CredentialList
                    credentials={credentials}
                    loading={credLoading}
                    onEdit={handleOpenEditCredential}
                    onDelete={(cred) => setDeletingCredential(cred)}
                    onCreateNew={handleOpenCreateCredential}
                  />
                </div>
              )}

              {currentView === "SETTINGS" && (
                <SettingsPage />
              )}
            </main>
          </div>
        </div>

        {/* Sesiones Remotas Simultáneas (SSH, WEB, VNC, SFTP) - Se mantienen vivas en memoria */}
        {sessionTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              className={`flex-1 h-full w-full p-2 bg-background ${
                isActive ? "flex flex-col" : "hidden"
              }`}
            >
              {tab.protocol === "SSH" && (
                <SshTerminalComponent
                  connection={tab.connection}
                  onBack={() => handleCloseTab(tab.id)}
                />
              )}
              {tab.protocol === "WEB" && (
                <WebConsoleComponent
                  connection={tab.connection}
                  onBack={() => handleCloseTab(tab.id)}
                />
              )}
              {tab.protocol === "VNC" && (
                <VncViewerComponent
                  connection={tab.connection}
                  onClose={() => handleCloseTab(tab.id)}
                />
              )}
              {tab.protocol === "SFTP" && (
                <SftpExplorerComponent
                  connection={tab.connection}
                  onBack={() => handleCloseTab(tab.id)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Modals & Dialogs */}
      <ConnectionFormModal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        onSave={handleSaveConnection}
        initialConnection={editingConnection}
        credentials={credentials}
        folders={folders}
        tags={tags}
      />

      <ConnectionEngineNoticeModal
        onClose={() => setNoticeConnection(null)}
        connection={noticeConnection}
      />

      <CredentialFormModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        onSave={handleSaveCredential}
        initialCredential={editingCredential}
      />

      <ConfirmDialog
        isOpen={!!deletingConnection}
        onClose={() => setDeletingConnection(null)}
        onConfirm={handleConfirmDeleteConnection}
        title="¿Eliminar Conexión?"
        description={`¿Estás seguro de que deseas eliminar permanentemente la conexión "${deletingConnection?.name}"? Esta acción no se puede deshacer.`}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deletingCredential}
        onClose={() => setDeletingCredential(null)}
        onConfirm={handleConfirmDeleteCredential}
        title="¿Eliminar Credencial?"
        description={`¿Estás seguro de que deseas eliminar la credencial "${deletingCredential?.name}"? El secreto será destruido del almacén seguro del sistema.`}
        loading={actionLoading}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={async (name, parentId) => {
          await createFolder(name, parentId);
        }}
        folders={folders}
      />

      {/* Delete Folder Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingFolderId}
        onClose={() => setDeletingFolderId(null)}
        onConfirm={handleConfirmDeleteFolder}
        title="¿Eliminar Carpeta?"
        description="¿Estás seguro de eliminar esta carpeta? Las conexiones contenidas pasarán a la raíz."
        loading={actionLoading}
      />

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onCreate={async (name, color) => {
          await createTag(name, color);
        }}
      />

      {/* Edit Tag Modal */}
      <EditTagModal
        isOpen={!!editingTag}
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onUpdate={async (id, name, color) => {
          await updateTag(id, name, color);
          refreshConnections();
        }}
        onDelete={async (id) => {
          await deleteTag(id);
          refreshConnections();
        }}
      />

      {/* Server Health Monitor Modal */}
      <ServerHealthModal
        isOpen={!!healthConnection}
        connection={healthConnection}
        onClose={() => setHealthConnection(null)}
      />

      {/* Backup & Export / Import Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshAll={() => {
          refreshConnections();
          refreshCredentials();
        }}
      />

      {/* Onboarding Guide Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onNavigateToVault={() => setCurrentView("CREDENTIALS")}
      />
    </div>
  );
}

export default App;
