import { useState, useRef } from "react";
import { useConnections } from "@/hooks/useConnections";
import { useCredentials } from "@/hooks/useCredentials";
import { useFolders } from "@/hooks/useFolders";
import { useTags } from "@/hooks/useTags";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

import { ConnectionList } from "@/components/connections/ConnectionList";
import { ConnectionFormModal } from "@/components/connections/ConnectionFormModal";
import { ConnectionEngineNoticeModal } from "@/components/connections/ConnectionEngineNoticeModal";

import { CredentialList } from "@/components/credentials/CredentialList";
import { CredentialFormModal } from "@/components/credentials/CredentialFormModal";

import { CreateFolderModal } from "@/components/folders/CreateFolderModal";
import { CreateTagModal } from "@/components/tags/CreateTagModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { SshTerminalComponent } from "@/components/terminal/SshTerminalComponent";
import { WebConsoleComponent } from "@/components/console/WebConsoleComponent";
import { VncViewerComponent } from "@/components/vnc/VncViewerComponent";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { Connection, CreateConnectionPayload, UpdateConnectionPayload } from "@/types/connection";
import { CredentialMetadata, CreateCredentialPayload, UpdateCredentialPayload } from "@/types/credential";
import { Plus, Filter, X } from "lucide-react";

export function App() {
  const [currentView, setCurrentView] = useState<"CONNECTIONS" | "CREDENTIALS" | "SETTINGS">("CONNECTIONS");

  // Onboarding Guide Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem("zyntratek_onboarding_seen") !== "true";
  });

  // Active Sessions
  const [activeSshConnection, setActiveSshConnection] = useState<Connection | null>(null);
  const [activeWebConnection, setActiveWebConnection] = useState<Connection | null>(null);
  const [activeVncConnection, setActiveVncConnection] = useState<Connection | null>(null);

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
  const [actionLoading, setActionLoading] = useState(false);

  // Connection Handler: Connect Button Action
  const handleConnect = (conn: Connection) => {
    if (conn.protocol === "SSH") {
      setActiveSshConnection(conn);
    } else if (conn.protocol === "WEB") {
      setActiveWebConnection(conn);
    } else if (conn.protocol === "VNC") {
      setActiveVncConnection(conn);
    } else {
      setNoticeConnection(conn);
    }
  };





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

  // Render Active Terminal View if an SSH session is active
  if (activeSshConnection) {
    return (
      <div className="h-screen w-screen p-3 bg-background">
        <SshTerminalComponent
          connection={activeSshConnection}
          onBack={() => setActiveSshConnection(null)}
        />
      </div>
    );
  }

  // Render Active Web Console View if a WEB session is active
  if (activeWebConnection) {
    return (
      <div className="h-screen w-screen p-3 bg-background">
        <WebConsoleComponent
          connection={activeWebConnection}
          onBack={() => setActiveWebConnection(null)}
        />
      </div>
    );
  }

  // Render Active VNC View if a VNC session is active
  if (activeVncConnection) {
    return (
      <div className="h-screen w-screen p-3 bg-background">
        <VncViewerComponent
          connection={activeVncConnection}
          onClose={() => setActiveVncConnection(null)}
        />
      </div>
    );
  }





  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none font-sans antialiased">
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
      />

      {/* Main Container */}
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
                  <Plus className="h-4 w-4" />
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
            <div className="max-w-6xl mx-auto">
              <SettingsPage />
            </div>
          )}
        </main>
      </div>

      {/* --- MODALS & DIALOGS --- */}

      {/* Connection Form Modal */}
      <ConnectionFormModal
        isOpen={isConnModalOpen}
        onClose={() => setIsConnModalOpen(false)}
        onSave={handleSaveConnection}
        initialConnection={editingConnection}
        credentials={credentials}
        folders={folders}
        tags={tags}
      />

      {/* Delete Connection Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingConnection}
        onClose={() => setDeletingConnection(null)}
        onConfirm={handleConfirmDeleteConnection}
        title="¿Eliminar Conexión?"
        description={
          <span>
            ¿Estás seguro de eliminar la conexión <strong>"{deletingConnection?.name}"</strong> ({deletingConnection?.protocol} - {deletingConnection?.host})?
            Esta acción borrará los metadatos de SQLite pero mantendrá intactas las credenciales del Vault.
          </span>
        }
        loading={actionLoading}
      />

      {/* Connection Engine Notice Modal (RDP notice for Phase 5) */}
      <ConnectionEngineNoticeModal
        connection={noticeConnection}
        onClose={() => setNoticeConnection(null)}
      />

      {/* Credential Form Modal */}
      <CredentialFormModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        onSave={handleSaveCredential}
        initialCredential={editingCredential}
      />

      {/* Delete Credential Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCredential}
        onClose={() => setDeletingCredential(null)}
        onConfirm={handleConfirmDeleteCredential}
        title="¿Eliminar Credencial del Vault?"
        description={
          <span>
            ¿Estás seguro de eliminar la credencial <strong>"{deletingCredential?.name}"</strong>?
            Se eliminará el registro de metadatos y el secreto custodiado en el <strong>OS Keyring</strong>.
          </span>
        }
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
