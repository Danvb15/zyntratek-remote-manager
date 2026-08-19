import React, { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderTree,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Upload,
  Download,
  FolderPlus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  HardDrive,
  Lock,
  Loader2,
  ChevronRight,
  Search,
  CornerLeftUp,
  Copy,
  Edit3,
  CheckCircle2,
  Monitor,
  Server,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Columns,
  Maximize2,
} from "lucide-react";
import { Connection } from "../../types/connection";
import { SftpFileEditorModal } from "./SftpFileEditorModal";

export interface SftpItem {
  name: string;
  isDir?: boolean;
  is_dir?: boolean;
  size: number;
  permissions: string;
  modified: string;
}

export interface SftpDirResult {
  current_path: string;
  entries: SftpItem[];
}

export interface LocalItem {
  name: string;
  isDir?: boolean;
  is_dir?: boolean;
  size: number;
  modified: string;
}

export interface LocalDirResult {
  current_path: string;
  entries: LocalItem[];
}

export interface LocalDriveEntry {
  name: string;
  path: string;
}

interface SftpExplorerComponentProps {
  connection: Connection;
  onBack: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  isRemote: boolean;
  item: SftpItem | LocalItem;
}

/**
 * Función infalible para determinar si un elemento es carpeta / directorio
 */
export const isFolder = (item: SftpItem | LocalItem | null | undefined): boolean => {
  if (!item) return false;
  if (item.name === "..") return true;
  if (typeof item.isDir === "boolean" && item.isDir) return true;
  if (typeof item.is_dir === "boolean" && item.is_dir) return true;
  if ("permissions" in item && typeof item.permissions === "string" && item.permissions.startsWith("d")) {
    return true;
  }
  return false;
};

export const SftpExplorerComponent: React.FC<SftpExplorerComponentProps> = ({
  connection,
  onBack,
}) => {
  // Vista: 'dual' (WinSCP Commander) o 'single' (Solo Remoto)
  const [viewMode, setViewMode] = useState<"dual" | "single">("dual");
  const [activePane, setActivePane] = useState<"local" | "remote">("remote");

  // Estado Remoto (SFTP Server)
  const [remotePath, setRemotePath] = useState<string>(".");
  const [remoteInputPath, setRemoteInputPath] = useState<string>(".");
  const [isEditingRemotePath, setIsEditingRemotePath] = useState<boolean>(false);
  const [remoteSearch, setRemoteSearch] = useState<string>("");
  const [remoteFiles, setRemoteFiles] = useState<SftpItem[]>([]);
  const [selectedRemoteFile, setSelectedRemoteFile] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState<boolean>(true);

  // Estado Local (Mi PC / Windows)
  const [localPath, setLocalPath] = useState<string>("");
  const [localInputPath, setLocalInputPath] = useState<string>("");
  const [isEditingLocalPath, setIsEditingLocalPath] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>("");
  const [localFiles, setLocalFiles] = useState<LocalItem[]>([]);
  const [selectedLocalFile, setSelectedLocalFile] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [localRoots, setLocalRoots] = useState<LocalDriveEntry[]>([]);

  // Estados Globales de Notificaciones y Transferencias
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [transferring, setTransferring] = useState<boolean>(false);

  // Menú Contextual Flotante
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Input de archivo oculto para carga tradicional
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Prompt de contraseña manual
  const [manualPasswordPrompt, setManualPasswordPrompt] = useState<boolean>(false);
  const [manualPassword, setManualPassword] = useState<string>("");

  // Estado del Editor de Archivos Integrado (F4)
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
    isRemote: boolean;
    content: string;
  }>({
    isOpen: false,
    filePath: "",
    fileName: "",
    isRemote: true,
    content: "",
  });

  // Drag and drop overlay visual
  const [isDraggingOverRemote, setIsDraggingOverRemote] = useState<boolean>(false);

  // 1. Cargar Raíces Locales (Descargas, Documentos, Discos C:, D:)
  const loadLocalRoots = useCallback(async () => {
    try {
      const roots = await invoke<LocalDriveEntry[]>("get_local_roots");
      setLocalRoots(roots);
    } catch {
      // Silencioso
    }
  }, []);

  // 2. Cargar Directorio Local
  const loadLocalDirectory = useCallback(async (path: string) => {
    setLocalLoading(true);
    setContextMenu(null);
    try {
      const result = await invoke<LocalDirResult>("list_local_dir", { path });
      setLocalFiles(result.entries || []);
      setLocalPath(result.current_path);
      setLocalInputPath(result.current_path);
    } catch (err: unknown) {
      setErrorNotice(`Error leyendo directorio local: ${(err as Error).message || String(err)}`);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  // 3. Cargar Directorio Remoto SFTP
  const loadRemoteDirectory = useCallback(
    async (path: string, pass?: string) => {
      setRemoteLoading(true);
      setErrorNotice(null);
      setContextMenu(null);
      try {
        const result = await invoke<SftpDirResult>("list_sftp_dir", {
          connectionId: connection.id,
          path: path,
          manualPassword: pass || (manualPassword ? manualPassword : null),
        });
        setRemoteFiles(result.entries || []);
        if (result.current_path) {
          setRemotePath(result.current_path);
          setRemoteInputPath(result.current_path);
        }
        setManualPasswordPrompt(false);
        setErrorNotice(null);
      } catch (err: unknown) {
        const msg = (err as Error)?.message || String(err);
        if (
          msg.includes("VaultError") ||
          msg.includes("Credencial no encontrada") ||
          msg.includes("Se requiere contraseña") ||
          msg.includes("Autenticación SFTP") ||
          msg.includes("Authentication failed") ||
          msg.includes("Session(-18)")
        ) {
          setManualPasswordPrompt(true);
          setErrorNotice(null);
        } else {
          setErrorNotice(`Error al leer servidor remoto: ${msg}`);
        }
      } finally {
        setRemoteLoading(false);
      }
    },
    [connection.id, manualPassword]
  );

  // Inicialización
  useEffect(() => {
    loadLocalRoots();
    loadLocalDirectory("");
    loadRemoteDirectory(remotePath);
  }, [loadLocalRoots, loadLocalDirectory, loadRemoteDirectory, remotePath]);

  // Cerrar menú contextual al hacer clic en cualquier parte
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // 3.5 Funciones del Editor de Código Integrado (F4)
  const handleOpenFileEditor = async (item: SftpItem | LocalItem, isRemote: boolean) => {
    if (isFolder(item)) return;
    setStatusNotice("Abriendo archivo en el editor...");
    setErrorNotice(null);
    try {
      if (isRemote) {
        const fullRemotePath = remotePath === "/" ? `/${item.name}` : `${remotePath}/${item.name}`;
        const content = await invoke<string>("read_sftp_file_content", {
          connectionId: connection.id,
          path: fullRemotePath,
          manualPassword: manualPassword || null,
        });
        setEditorModal({
          isOpen: true,
          filePath: fullRemotePath,
          fileName: item.name,
          isRemote: true,
          content,
        });
      } else {
        const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
        const fullLocalPath = `${localPath}${sep}${item.name}`;
        const content = await invoke<string>("read_local_file_content", {
          path: fullLocalPath,
        });
        setEditorModal({
          isOpen: true,
          filePath: fullLocalPath,
          fileName: item.name,
          isRemote: false,
          content,
        });
      }
      setStatusNotice(null);
    } catch (err: unknown) {
      const msg = (err as Error).message || "No se pudo abrir el archivo en el editor.";
      setErrorNotice(msg);
      setStatusNotice(null);
    }
  };

  const handleSaveFileEditor = async (newContent: string) => {
    if (editorModal.isRemote) {
      await invoke("write_sftp_file_content", {
        connectionId: connection.id,
        path: editorModal.filePath,
        content: newContent,
        manualPassword: manualPassword || null,
      });
      loadRemoteDirectory(remotePath);
    } else {
      await invoke("write_local_file_content", {
        path: editorModal.filePath,
        content: newContent,
      });
      loadLocalDirectory(localPath);
    }
  };

  // 4. Atajos de Teclado Profesionales estilo WinSCP (F4, F5, F7, F8, Enter, Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // F4 -> Editar archivo
      if (e.key === "F4") {
        e.preventDefault();
        if (activePane === "local" && selectedLocalFile) {
          const item = localFiles.find((f) => f.name === selectedLocalFile);
          if (item && !isFolder(item)) handleOpenFileEditor(item, false);
        } else if (activePane === "remote" && selectedRemoteFile) {
          const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
          if (item && !isFolder(item)) handleOpenFileEditor(item, true);
        }
      }
      // F5 -> Transferir entre paneles
      else if (e.key === "F5") {
        e.preventDefault();
        if (activePane === "local" && selectedLocalFile) {
          const item = localFiles.find((f) => f.name === selectedLocalFile);
          if (item) handleUploadFromLocal(item);
        } else if (activePane === "remote" && selectedRemoteFile) {
          const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
          if (item) handleDownloadToLocal(item);
        }
      }
      // F7 -> Nueva Carpeta
      else if (e.key === "F7") {
        e.preventDefault();
        if (activePane === "local") handleCreateLocalDir();
        else handleCreateRemoteDir();
      }
      // F8 o Delete -> Eliminar
      else if (e.key === "F8" || e.key === "Delete") {
        e.preventDefault();
        if (activePane === "local" && selectedLocalFile) {
          const item = localFiles.find((f) => f.name === selectedLocalFile);
          if (item) handleDeleteLocalItem(item);
        } else if (activePane === "remote" && selectedRemoteFile) {
          const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
          if (item) handleDeleteRemoteItem(item);
        }
      }
      // F9 o Ctrl+R -> Refrescar
      else if (e.key === "F9" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        loadLocalDirectory(localPath);
        loadRemoteDirectory(remotePath);
      }
      // Enter -> Entrar a Carpeta
      else if (e.key === "Enter") {
        if (activePane === "local" && selectedLocalFile) {
          const item = localFiles.find((f) => f.name === selectedLocalFile);
          if (item && isFolder(item)) handleOpenLocalFolder(item);
        } else if (activePane === "remote" && selectedRemoteFile) {
          const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
          if (item && isFolder(item)) handleOpenRemoteFolder(item);
        }
      }
      // Backspace -> Subir un nivel
      else if (e.key === "Backspace") {
        if (activePane === "local") handleGoUpLocal();
        else handleGoUpRemote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activePane,
    selectedLocalFile,
    selectedRemoteFile,
    localFiles,
    remoteFiles,
    localPath,
    remotePath,
  ]);

  // Navegación Local
  const handleOpenLocalFolder = (item: LocalItem) => {
    if (!isFolder(item)) return;
    if (item.name === "..") {
      handleGoUpLocal();
      return;
    }
    const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
    const next = `${localPath}${sep}${item.name}`;
    loadLocalDirectory(next);
    setSelectedLocalFile(null);
  };

  const handleGoUpLocal = () => {
    const parts = localPath.split(/[\\/]/).filter(Boolean);
    if (parts.length <= 1) {
      if (localPath.includes(":")) {
        loadLocalDirectory(`${parts[0]}\\`);
      }
      return;
    }
    parts.pop();
    const isWindowsRoot = parts.length === 1 && parts[0].includes(":");
    const next = isWindowsRoot ? `${parts[0]}\\` : parts.join("\\");
    loadLocalDirectory(next);
    setSelectedLocalFile(null);
  };

  // Navegación Remota
  const handleOpenRemoteFolder = (item: SftpItem) => {
    if (!isFolder(item)) return;
    if (item.name === "..") {
      handleGoUpRemote();
      return;
    }
    const newPath =
      remotePath === "/"
        ? `/${item.name}`
        : `${remotePath.replace(/\/$/, "")}/${item.name}`;
    loadRemoteDirectory(newPath);
    setSelectedRemoteFile(null);
  };

  const handleGoUpRemote = () => {
    if (remotePath === "/" || remotePath === ".") return;
    const parts = remotePath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? "/" : "/" + parts.join("/");
    loadRemoteDirectory(newPath);
    setSelectedRemoteFile(null);
  };

  // 5. Transferencias Directas estilo WinSCP (Local -> Remoto)
  const handleUploadFromLocal = async (localItem: LocalItem) => {
    if (localItem.name === "..") return;

    const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
    const sourceLocalPath = `${localPath}${sep}${localItem.name}`;
    const targetRemotePath =
      remotePath === "/"
        ? `/${localItem.name}`
        : `${remotePath.replace(/\/$/, "")}/${localItem.name}`;

    try {
      setTransferring(true);
      setStatusNotice(`Subiendo '${localItem.name}' a ${remotePath}...`);
      await invoke("upload_sftp_file", {
        connectionId: connection.id,
        remotePath: targetRemotePath,
        localFilePath: sourceLocalPath,
        manualPassword: manualPassword || null,
      });

      setStatusNotice(`¡'${localItem.name}' subido exitosamente al servidor!`);
      setTimeout(() => setStatusNotice(null), 3500);
      loadRemoteDirectory(remotePath);
    } catch (err: unknown) {
      setErrorNotice(`Error en la subida: ${(err as Error).message || String(err)}`);
    } finally {
      setTransferring(false);
    }
  };

  // 6. Transferencias Directas estilo WinSCP (Remoto -> Local)
  const handleDownloadToLocal = async (remoteItem: SftpItem) => {
    if (remoteItem.name === "..") return;

    const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
    const destLocalPath = `${localPath}${sep}${remoteItem.name}`;
    const sourceRemotePath =
      remotePath === "/"
        ? `/${remoteItem.name}`
        : `${remotePath.replace(/\/$/, "")}/${remoteItem.name}`;

    try {
      setTransferring(true);
      setStatusNotice(`Descargando '${remoteItem.name}' a ${localPath}...`);
      await invoke("download_sftp_file", {
        connectionId: connection.id,
        remoteFilePath: sourceRemotePath,
        localDestinationPath: destLocalPath,
        manualPassword: manualPassword || null,
      });

      setStatusNotice(`¡'${remoteItem.name}' guardado exitosamente en tu PC!`);
      setTimeout(() => setStatusNotice(null), 3500);
      loadLocalDirectory(localPath);
    } catch (err: unknown) {
      setErrorNotice(`Error en la descarga: ${(err as Error).message || String(err)}`);
    } finally {
      setTransferring(false);
    }
  };

  // Creación y Eliminación Local
  const handleCreateLocalDir = async () => {
    const name = prompt("Nombre de la nueva carpeta en tu PC:");
    if (!name || !name.trim()) return;
    const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
    const target = `${localPath}${sep}${name.trim()}`;
    try {
      await invoke("create_local_dir", { path: target });
      loadLocalDirectory(localPath);
    } catch (err: unknown) {
      setErrorNotice(`Error creando carpeta local: ${(err as Error).message || String(err)}`);
    }
  };

  const handleDeleteLocalItem = async (item: LocalItem) => {
    if (item.name === "..") return;
    if (confirm(`¿Eliminar '${item.name}' permanentemente de tu PC?`)) {
      const sep = localPath.endsWith("\\") || localPath.endsWith("/") ? "" : "\\";
      const target = `${localPath}${sep}${item.name}`;
      try {
        await invoke("delete_local_item", { path: target, isDir: isFolder(item) });
        setSelectedLocalFile(null);
        loadLocalDirectory(localPath);
      } catch (err: unknown) {
        setErrorNotice(`Error eliminando archivo local: ${(err as Error).message || String(err)}`);
      }
    }
  };

  // Creación y Eliminación Remota
  const handleCreateRemoteDir = async () => {
    const folderName = prompt("Nombre de la nueva carpeta remota en el servidor:");
    if (!folderName || !folderName.trim()) return;
    const targetFolderPath =
      remotePath === "/"
        ? `/${folderName.trim()}`
        : `${remotePath.replace(/\/$/, "")}/${folderName.trim()}`;

    try {
      await invoke("create_sftp_dir", {
        connectionId: connection.id,
        path: targetFolderPath,
        manualPassword: manualPassword || null,
      });
      loadRemoteDirectory(remotePath);
    } catch (err: unknown) {
      setErrorNotice(`Error al crear carpeta remota: ${(err as Error).message || String(err)}`);
    }
  };

  const handleDeleteRemoteItem = async (item: SftpItem) => {
    if (item.name === "..") return;
    if (confirm(`¿Eliminar '${item.name}' del servidor remoto?`)) {
      const fullPath =
        remotePath === "/"
          ? `/${item.name}`
          : `${remotePath.replace(/\/$/, "")}/${item.name}`;

      try {
        await invoke("delete_sftp_item", {
          connectionId: connection.id,
          path: fullPath,
          isDir: isFolder(item),
          manualPassword: manualPassword || null,
        });
        setSelectedRemoteFile(null);
        loadRemoteDirectory(remotePath);
      } catch (err: unknown) {
        setErrorNotice(`Error al eliminar elemento remoto: ${(err as Error).message || String(err)}`);
      }
    }
  };

  // Menús Contextuales
  const handleContextMenu = (e: React.MouseEvent, item: SftpItem | LocalItem, isRemote: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRemote) {
      setActivePane("remote");
      setSelectedRemoteFile(item.name);
    } else {
      setActivePane("local");
      setSelectedLocalFile(item.name);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isRemote,
      item,
    });
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleManualPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPassword.trim()) {
      loadRemoteDirectory(remotePath, manualPassword.trim());
    }
  };

  const formatSize = (bytes: number, folder: boolean) => {
    if (folder) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string, folder: boolean) => {
    if (folder) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/40 shrink-0" />;
    }
    if (name.endsWith(".yml") || name.endsWith(".json") || name.endsWith(".ts") || name.endsWith(".rs") || name.endsWith(".sh")) {
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (name.endsWith(".log") || name.endsWith(".txt") || name.endsWith(".md")) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  // Filtrado y ordenamiento: CARPETAS SIEMPRE ARRIBA
  const sortedLocalFiles = [...localFiles]
    .filter((f) => f.name.toLowerCase().includes(localSearch.toLowerCase().trim()))
    .sort((a, b) => {
      if (a.name === "..") return -1;
      if (b.name === "..") return 1;
      const aIsDir = isFolder(a);
      const bIsDir = isFolder(b);
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const sortedRemoteFiles = [...remoteFiles]
    .filter((f) => f.name.toLowerCase().includes(remoteSearch.toLowerCase().trim()))
    .sort((a, b) => {
      if (a.name === "..") return -1;
      if (b.name === "..") return 1;
      const aIsDir = isFolder(a);
      const bIsDir = isFolder(b);
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  // Segmentos de ruta remota
  const remotePathSegments = remotePath.split("/").filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-[#0A1120] text-slate-100 font-sans rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const f = e.target.files[0];
            handleUploadFromLocal({ name: f.name, isDir: false, is_dir: false, size: f.size, modified: "" });
          }
        }}
        className="hidden"
      />

      {/* Encabezado Superior WinSCP Commander */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Regresar a Conexiones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-100 tracking-wide">{connection.name}</span>
              <span className="px-2 py-0.2 text-[10px] font-mono rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                WinSCP Commander Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {connection.username}@{connection.host}:{connection.port || 22}
            </p>
          </div>
        </div>

        {/* Controles de Vista & Acciones Globales */}
        <div className="flex items-center space-x-2">
          {/* Toggle Dual/Single Pane */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("dual")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === "dual" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
              title="Doble Panel: Local (PC) + Remoto (Servidor)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Doble Panel</span>
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === "single" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
              title="Solo Panel Remoto"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Solo Remoto</span>
            </button>
          </div>

          <button
            onClick={() => {
              loadLocalDirectory(localPath);
              loadRemoteDirectory(remotePath);
            }}
            disabled={remoteLoading || localLoading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Refrescar ambos paneles (F9)"
          >
            <RefreshCw className={`w-4 h-4 ${remoteLoading || localLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Prompt de Contraseña Manual si es necesaria */}
      {manualPasswordPrompt && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between animate-fadeIn shrink-0">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-200">Autenticación SSH/SFTP Requerida</p>
              <p className="text-[11px] text-amber-300/80">
                Ingrese la contraseña de {connection.username}@{connection.host}
              </p>
            </div>
          </div>
          <form onSubmit={handleManualPasswordSubmit} className="flex items-center space-x-2">
            <input
              type="password"
              placeholder="Contraseña del servidor..."
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Conectar
            </button>
          </form>
        </div>
      )}

      {/* Barra de Avisos de Transferencia y Estados */}
      {statusNotice && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-1.5 text-xs text-cyan-300 flex items-center space-x-2 animate-fadeIn shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
          <span className="font-semibold">{statusNotice}</span>
        </div>
      )}

      {copiedNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 text-xs text-emerald-300 flex items-center space-x-2 animate-fadeIn shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>¡Ruta copiada al portapapeles!</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-between shrink-0">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-rose-400 hover:text-white font-bold text-sm ml-2">
            ×
          </button>
        </div>
      )}

      {/* ÁREA PRINCIPAL: DOS PANELES (LOCAL A LA IZQUIERDA, REMOTO A LA DERECHA) */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL IZQUIERDO: SISTEMA LOCAL (MI PC / WINDOWS) */}
        {viewMode === "dual" && (
          <div
            onClick={() => setActivePane("local")}
            className={`flex-1 flex flex-col border-r border-slate-800 transition-colors ${
              activePane === "local" ? "bg-[#09101E]" : "bg-[#070D18] opacity-95"
            }`}
          >
            {/* Cabecera del Panel Local */}
            <div className="p-2 bg-[#0E1626] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">Mi PC (Local)</span>
                {/* Selector rápido de Unidades / Descargas */}
                <select
                  value={localPath}
                  onChange={(e) => loadLocalDirectory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-[11px] text-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500"
                >
                  {localRoots.map((r, i) => (
                    <option key={i} value={r.path}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCreateLocalDir}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-amber-300"
                  title="Nueva Carpeta Local (F7)"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => loadLocalDirectory(localPath)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Refrescar Local"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${localLoading ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Barra de Ruta Local */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0A1220] border-b border-slate-800/80 text-xs">
              <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
                <button
                  onClick={handleGoUpLocal}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                  title="Subir Nivel (Backspace)"
                >
                  <CornerLeftUp className="w-3.5 h-3.5" />
                </button>
                {isEditingLocalPath ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsEditingLocalPath(false);
                      if (localInputPath.trim()) loadLocalDirectory(localInputPath.trim());
                    }}
                    className="flex-1"
                  >
                    <input
                      type="text"
                      value={localInputPath}
                      onChange={(e) => setLocalInputPath(e.target.value)}
                      onBlur={() => setIsEditingLocalPath(false)}
                      className="w-full bg-slate-900 border border-emerald-500 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                      autoFocus
                    />
                  </form>
                ) : (
                  <span
                    onClick={() => setIsEditingLocalPath(true)}
                    className="font-mono text-[11px] text-slate-300 truncate cursor-text hover:text-emerald-300 flex-1 px-1"
                  >
                    {localPath}
                  </span>
                )}
                <button
                  onClick={() => setIsEditingLocalPath(!isEditingLocalPath)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <div className="relative w-28 ml-2 shrink-0">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded pl-6 pr-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Tabla de Archivos Locales */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase sticky top-0 backdrop-blur-md">
                    <th className="py-2 px-3 font-semibold">Nombre</th>
                    <th className="py-2 px-2 font-semibold w-16">Tipo</th>
                    <th className="py-2 px-2 font-semibold w-16 text-right">Tamaño</th>
                    <th className="py-2 px-2 font-semibold w-24">Modificado</th>
                    <th className="py-2 px-2 font-semibold w-20 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                  {sortedLocalFiles.map((file) => {
                    const isSelected = selectedLocalFile === file.name;
                    const folder = isFolder(file);
                    return (
                      <tr
                        key={file.name}
                        onClick={() => {
                          setActivePane("local");
                          setSelectedLocalFile(file.name);
                        }}
                        onDoubleClick={() => {
                          if (folder) handleOpenLocalFolder(file);
                          else handleUploadFromLocal(file);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, file, false)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-600/25 text-emerald-100 font-semibold"
                            : folder
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-100"
                            : "hover:bg-slate-800/60 text-slate-300"
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div
                            onClick={() => {
                              if (folder) handleOpenLocalFolder(file);
                            }}
                            className="flex items-center space-x-2 truncate"
                          >
                            {getFileIcon(file.name, folder)}
                            <span className={`truncate ${folder ? "font-bold text-amber-300 hover:underline cursor-pointer" : ""}`}>
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {folder ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold text-[9px] border border-amber-500/40 shadow-xs">
                              📁 CARPETA
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">📄 Archivo</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">{formatSize(file.size, folder)}</td>
                        <td className="py-2 px-2 text-slate-500 text-[10px]">{file.modified}</td>
                        <td className="py-2 px-2 text-center">
                          {file.name !== ".." && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (folder) handleOpenLocalFolder(file);
                                else handleUploadFromLocal(file);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-sans font-bold flex items-center space-x-1 mx-auto transition-all ${
                                folder
                                  ? "bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/50"
                                  : "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30"
                              }`}
                              title={folder ? "Entrar a carpeta" : "Subir al Servidor (F5)"}
                            >
                              {folder ? (
                                <span>📁 Entrar</span>
                              ) : (
                                <>
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Subir</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen Pie Panel Local */}
            <div className="px-3 py-1 bg-[#0A1220] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>{localFiles.length} elementos locales</span>
              <span className="text-amber-400/90 font-bold">{localFiles.filter((f) => isFolder(f) && f.name !== "..").length} carpetas</span>
            </div>
          </div>
        )}

        {/* BARRA CENTRAL DE TRANSFERENCIA (ACCIONES WINSCP) */}
        {viewMode === "dual" && (
          <div className="w-12 bg-[#0B1322] border-r border-slate-800 flex flex-col items-center justify-center space-y-4 shrink-0 py-4 z-10 shadow-lg">
            <button
              onClick={() => {
                if (selectedLocalFile) {
                  const item = localFiles.find((f) => f.name === selectedLocalFile);
                  if (item) handleUploadFromLocal(item);
                } else {
                  alert("Selecciona un archivo del panel de tu PC (izquierdo) para subirlo.");
                }
              }}
              disabled={transferring}
              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 hover:scale-110 active:scale-95 transition-all shadow-md"
              title="Subir archivo seleccionado a Servidor Remoto (F5)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-tighter">F5</div>

            <button
              onClick={() => {
                if (selectedRemoteFile) {
                  const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
                  if (item) handleDownloadToLocal(item);
                } else {
                  alert("Selecciona un archivo del servidor remoto (derecho) para descargarlo a tu PC.");
                }
              }}
              disabled={transferring}
              className="p-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 hover:scale-110 active:scale-95 transition-all shadow-md"
              title="Descargar archivo seleccionado a tu PC (F5)"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                loadLocalDirectory(localPath);
                loadRemoteDirectory(remotePath);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Sincronizar / Refrescar ambos lados (F9)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PANEL DERECHO: SERVIDOR REMOTO (LINUX / SFTP) */}
        <div
          onClick={() => setActivePane("remote")}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOverRemote(true);
          }}
          onDragLeave={() => setIsDraggingOverRemote(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverRemote(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const f = e.dataTransfer.files[0];
              handleUploadFromLocal({ name: f.name, isDir: false, is_dir: false, size: f.size, modified: "" });
            }
          }}
          className={`flex-1 flex flex-col relative transition-colors ${
            activePane === "remote" ? "bg-[#09101E]" : "bg-[#070D18] opacity-95"
          }`}
        >
          {/* Overlay Visual de Drag & Drop */}
          {isDraggingOverRemote && (
            <div className="absolute inset-0 z-50 bg-cyan-950/90 backdrop-blur-xs border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
              <Upload className="w-10 h-10 text-cyan-400 animate-bounce mb-2" />
              <p className="text-sm font-bold text-cyan-200">Suelte el archivo aquí para subirlo al servidor</p>
              <p className="text-xs text-cyan-400/80 font-mono mt-1">{remotePath}</p>
            </div>
          )}

          {/* Cabecera del Panel Remoto */}
          <div className="p-2 bg-[#0E1626] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-slate-200">Servidor Remoto ({connection.name})</span>
              {/* Accesos rápidos Remotos: / root y ~ home */}
              <button
                onClick={() => loadRemoteDirectory("/")}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-cyan-300 font-mono"
                title="Ir a Raíz (/)"
              >
                / root
              </button>
              <button
                onClick={() => loadRemoteDirectory(".")}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-amber-300 font-mono"
                title="Ir al Home del Usuario (~)"
              >
                ~ home
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleCreateRemoteDir}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-amber-300"
                title="Nueva Carpeta Remota (F7)"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => loadRemoteDirectory(remotePath)}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                title="Refrescar Remoto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${remoteLoading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Barra de Migas de Pan / Entrada de Ruta Remota */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0A1220] border-b border-slate-800/80 text-xs">
            <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
              <button
                onClick={handleGoUpRemote}
                disabled={remotePath === "/" || remotePath === "." || remoteLoading}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 disabled:opacity-30"
                title="Subir Nivel (Backspace)"
              >
                <CornerLeftUp className="w-3.5 h-3.5" />
              </button>

              <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-1" />

              {isEditingRemotePath ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsEditingRemotePath(false);
                    if (remoteInputPath.trim()) loadRemoteDirectory(remoteInputPath.trim());
                  }}
                  className="flex-1"
                >
                  <input
                    type="text"
                    value={remoteInputPath}
                    onChange={(e) => setRemoteInputPath(e.target.value)}
                    onBlur={() => setIsEditingRemotePath(false)}
                    className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                    autoFocus
                  />
                </form>
              ) : (
                <div className="flex items-center space-x-1 flex-1 font-mono text-[11px]">
                  <button
                    onClick={() => loadRemoteDirectory("/")}
                    className="px-1 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 font-semibold"
                  >
                    /
                  </button>
                  {remotePathSegments.map((segment, idx) => (
                    <React.Fragment key={idx}>
                      <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <button
                        onClick={() => {
                          const target = "/" + remotePathSegments.slice(0, idx + 1).join("/");
                          loadRemoteDirectory(target);
                        }}
                        className={`px-1 py-0.5 rounded hover:bg-slate-800 transition-colors ${
                          idx === remotePathSegments.length - 1
                            ? "text-cyan-300 font-bold bg-cyan-500/10"
                            : "text-slate-300 hover:text-cyan-300"
                        }`}
                      >
                        {segment}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsEditingRemotePath(!isEditingRemotePath)}
                className="p-1 text-slate-400 hover:text-slate-200 ml-1"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            <div className="relative w-28 ml-2 shrink-0">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
              <input
                type="text"
                placeholder="Filtrar..."
                value={remoteSearch}
                onChange={(e) => setRemoteSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded pl-6 pr-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabla de Archivos Remotos */}
          <div className="flex-1 overflow-y-auto relative scrollbar-thin">
            {remoteLoading && (
              <div className="absolute inset-0 bg-[#0A1120]/70 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-medium bg-slate-900/90 px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando servidor remoto...</span>
                </div>
              </div>
            )}

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase sticky top-0 backdrop-blur-md z-10">
                  <th className="py-2 px-3 font-semibold">Nombre</th>
                  <th className="py-2 px-2 font-semibold w-16">Tipo</th>
                  <th className="py-2 px-2 font-semibold w-16 text-right">Tamaño</th>
                  <th className="py-2 px-2 font-semibold w-20">Permisos</th>
                  <th className="py-2 px-2 font-semibold w-24">Modificado</th>
                  <th className="py-2 px-2 font-semibold w-20 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                {sortedRemoteFiles.map((file) => {
                  const isSelected = selectedRemoteFile === file.name;
                  const folder = isFolder(file);
                  return (
                    <tr
                      key={file.name}
                      onClick={() => {
                        setActivePane("remote");
                        setSelectedRemoteFile(file.name);
                      }}
                      onDoubleClick={() => {
                        if (folder) handleOpenRemoteFolder(file);
                        else handleDownloadToLocal(file);
                      }}
                      onContextMenu={(e) => handleContextMenu(e, file, true)}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-cyan-600/25 text-cyan-100 font-semibold"
                          : folder
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-100"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <td className="py-2 px-3">
                        <div
                          onClick={() => {
                            if (folder) handleOpenRemoteFolder(file);
                          }}
                          className="flex items-center space-x-2 truncate"
                        >
                          {getFileIcon(file.name, folder)}
                          <span className={`truncate ${folder ? "font-bold text-amber-300 hover:underline cursor-pointer" : ""}`}>
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        {folder ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold text-[9px] border border-amber-500/40 shadow-xs">
                            📁 CARPETA
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">📄 Archivo</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400">{formatSize(file.size, folder)}</td>
                      <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{file.permissions}</td>
                      <td className="py-2 px-2 text-slate-500 text-[10px]">{file.modified}</td>
                      <td className="py-2 px-2 text-center">
                        {file.name !== ".." && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (folder) handleOpenRemoteFolder(file);
                              else handleDownloadToLocal(file);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-sans font-bold flex items-center space-x-1 mx-auto transition-all ${
                              folder
                                ? "bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/50"
                                : "bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/30"
                            }`}
                            title={folder ? "Entrar a carpeta" : "Descargar a tu PC (F5)"}
                          >
                            {folder ? (
                              <span>📁 Entrar</span>
                            ) : (
                              <>
                                <ArrowLeftIcon className="w-3 h-3" />
                                <span>Bajar</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen Pie Panel Remoto */}
          <div className="px-3 py-1 bg-[#0A1220] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>{remoteFiles.length} elementos remotos</span>
            <span className="text-amber-400/90 font-bold">{remoteFiles.filter((f) => isFolder(f) && f.name !== "..").length} carpetas</span>
          </div>
        </div>
      </div>

      {/* MENÚ CONTEXTUAL DE CLIC DERECHO FLOTANTE */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[180px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 text-xs select-none animate-fadeIn font-sans backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-800 font-mono text-[10px] text-slate-400 font-semibold truncate max-w-[220px] flex items-center space-x-1.5">
            {isFolder(contextMenu.item) ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">CARPETA</span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">ARCHIVO</span>
            )}
            <span className="truncate">{contextMenu.item.name}</span>
          </div>

          {isFolder(contextMenu.item) ? (
            <button
              onClick={() => {
                if (contextMenu.isRemote) handleOpenRemoteFolder(contextMenu.item as SftpItem);
                else handleOpenLocalFolder(contextMenu.item as LocalItem);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 font-bold flex items-center space-x-2"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar a Carpeta</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (contextMenu.isRemote) handleDownloadToLocal(contextMenu.item as SftpItem);
                else handleUploadFromLocal(contextMenu.item as LocalItem);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 text-cyan-300 font-bold flex items-center space-x-2"
            >
              {contextMenu.isRemote ? (
                <>
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Descargar a mi PC (F5)</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subir al Servidor (F5)</span>
                </>
              )}
            </button>
          )}

          {!isFolder(contextMenu.item) && (
            <button
              onClick={() => {
                handleOpenFileEditor(contextMenu.item, contextMenu.isRemote);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 text-indigo-300 font-semibold flex items-center space-x-2"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editar Archivo (F4)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (contextMenu.isRemote) {
                const full = remotePath === "/" ? `/${contextMenu.item.name}` : `${remotePath}/${contextMenu.item.name}`;
                handleCopyPath(full);
              } else {
                const full = `${localPath}\\${contextMenu.item.name}`;
                handleCopyPath(full);
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copiar Ruta Completa</span>
          </button>

          {contextMenu.item.name !== ".." && (
            <button
              onClick={() => {
                if (contextMenu.isRemote) handleDeleteRemoteItem(contextMenu.item as SftpItem);
                else handleDeleteLocalItem(contextMenu.item as LocalItem);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-300 font-medium flex items-center space-x-2 border-t border-slate-800"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar (F8)</span>
            </button>
          )}
        </div>
      )}

      {/* BARRA DE TECLAS DE ACCESO RÁPIDO ESTILO WINSCP (F4, F5, F7, F8, F9) */}
      <div className="bg-[#080E1A] border-t border-slate-800 p-1.5 flex items-center justify-between text-[11px] font-mono shrink-0">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-slate-500 font-sans text-[10px] mr-1">Atajos WinSCP:</span>
          
          <button
            onClick={() => {
              if (activePane === "local" && selectedLocalFile) {
                const item = localFiles.find((f) => f.name === selectedLocalFile);
                if (item && !isFolder(item)) handleOpenFileEditor(item, false);
              } else if (activePane === "remote" && selectedRemoteFile) {
                const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
                if (item && !isFolder(item)) handleOpenFileEditor(item, true);
              }
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 text-slate-200 border border-slate-700 flex items-center space-x-1"
            title="Editar archivo seleccionado con el editor de código integrado"
          >
            <kbd className="text-indigo-400 font-bold">F4</kbd>
            <span>Editar</span>
          </button>

          <button
            onClick={() => {
              if (activePane === "local" && selectedLocalFile) {
                const item = localFiles.find((f) => f.name === selectedLocalFile);
                if (item) handleUploadFromLocal(item);
              } else if (activePane === "remote" && selectedRemoteFile) {
                const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
                if (item) handleDownloadToLocal(item);
              }
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-600/30 text-slate-200 border border-slate-700 flex items-center space-x-1"
          >
            <kbd className="text-cyan-400 font-bold">F5</kbd>
            <span>Transferir</span>
          </button>

          <button
            onClick={() => {
              if (activePane === "local") handleCreateLocalDir();
              else handleCreateRemoteDir();
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-600/30 text-slate-200 border border-slate-700 flex items-center space-x-1"
          >
            <kbd className="text-amber-400 font-bold">F7</kbd>
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={() => {
              if (activePane === "local" && selectedLocalFile) {
                const item = localFiles.find((f) => f.name === selectedLocalFile);
                if (item) handleDeleteLocalItem(item);
              } else if (activePane === "remote" && selectedRemoteFile) {
                const item = remoteFiles.find((f) => f.name === selectedRemoteFile);
                if (item) handleDeleteRemoteItem(item);
              }
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-600/30 text-slate-200 border border-slate-700 flex items-center space-x-1"
          >
            <kbd className="text-rose-400 font-bold">F8</kbd>
            <span>Eliminar</span>
          </button>

          <button
            onClick={() => {
              loadLocalDirectory(localPath);
              loadRemoteDirectory(remotePath);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
          >
            <kbd className="text-slate-400 font-bold">F9</kbd>
            <span>Refrescar</span>
          </button>
        </div>

        <div className="text-slate-400 text-[10px] hidden sm:block">
          Panel activo: <span className="font-bold text-cyan-300">{activePane === "local" ? "Mi PC (Local)" : "Servidor Remoto"}</span>
        </div>
      </div>

      {/* MODAL EDITOR DE CÓDIGO INTEGRADO (F4) */}
      <SftpFileEditorModal
        isOpen={editorModal.isOpen}
        onClose={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
        filePath={editorModal.filePath}
        fileName={editorModal.fileName}
        isRemote={editorModal.isRemote}
        initialContent={editorModal.content}
        onSave={handleSaveFileEditor}
      />
    </div>
  );
};
