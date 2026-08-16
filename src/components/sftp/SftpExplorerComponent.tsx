import React, { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderTree,
  Folder,
  File,
  FileCode,
  FileText,
  Upload,
  Download,
  FolderPlus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Connection } from "../../types/connection";

interface SftpItem {
  name: string;
  isDir: boolean;
  size: number;
  permissions: string;
  modified: string;
}

interface SftpExplorerComponentProps {
  connection: Connection;
  onBack: () => void;
}

export const SftpExplorerComponent: React.FC<SftpExplorerComponentProps> = ({
  connection,
  onBack,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [files, setFiles] = useState<SftpItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Hidden File Input Ref for Uploading Local File
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Prompt de contraseña manual si la bóveda no la tiene
  const [manualPasswordPrompt, setManualPasswordPrompt] = useState<boolean>(false);
  const [manualPassword, setManualPassword] = useState<string>("");

  const loadDirectory = useCallback(
    async (path: string, pass?: string) => {
      setLoading(true);
      setErrorNotice(null);
      try {
        const result = await invoke<SftpItem[]>("list_sftp_dir", {
          connectionId: connection.id,
          path: path,
          manualPassword: pass || (manualPassword ? manualPassword : null),
        });
        setFiles(result);
        setManualPasswordPrompt(false);
      } catch (err: unknown) {
        const msg = (err as Error)?.message || String(err);
        if (
          msg.includes("VaultError") ||
          msg.includes("Credencial no encontrada") ||
          msg.includes("Se requiere contraseña") ||
          msg.includes("Autenticación SFTP no completada")
        ) {
          setManualPasswordPrompt(true);
        } else {
          setErrorNotice(`Error al leer directorio remoto: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [connection.id, manualPassword]
  );

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  const formatSize = (bytes: number, isDir: boolean) => {
    if (isDir) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (item: SftpItem) => {
    if (item.isDir) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    }
    if (
      item.name.endsWith(".yml") ||
      item.name.endsWith(".nginx") ||
      item.name.endsWith(".json") ||
      item.name.endsWith(".ts") ||
      item.name.endsWith(".rs")
    ) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    if (item.name.endsWith(".log") || item.name.endsWith(".txt")) {
      return <FileText className="w-4 h-4 text-sky-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const handleOpenFolder = (item: SftpItem) => {
    if (!item.isDir) return;
    if (item.name === "..") {
      const parts = currentPath.split("/").filter(Boolean);
      parts.pop();
      const newPath = parts.length === 0 ? "." : "/" + parts.join("/");
      setCurrentPath(newPath);
    } else {
      const newPath =
        currentPath === "." || currentPath === "/"
          ? `/${item.name}`
          : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    }
    setSelectedFile(null);
  };

  const handleTriggerUpload = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
      uploadInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const fileName = file.name;
    // Extraer ruta local si es proporcionada por Electron/Tauri File
    const localFilePath = (file as unknown as { path?: string }).path || fileName;

    const remoteTarget =
      currentPath === "." || currentPath === "/"
        ? `/${fileName}`
        : `${currentPath}/${fileName}`;

    try {
      setStatusNotice(`Subiendo ${fileName} al servidor remoto...`);
      await invoke("upload_sftp_file", {
        connectionId: connection.id,
        remotePath: remoteTarget,
        localFilePath: localFilePath,
        manualPassword: manualPassword || null,
      });

      setStatusNotice(`¡Archivo ${fileName} subido exitosamente!`);
      setTimeout(() => setStatusNotice(null), 3000);
      loadDirectory(currentPath);
    } catch (err: unknown) {
      setErrorNotice(`Falló la subida de archivo: ${(err as Error).message || String(err)}`);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    const localDest = prompt(
      "Ingrese la ruta de destino local para guardar el archivo:",
      `C:\\Users\\Public\\Downloads\\${selectedFile}`
    );

    if (!localDest || !localDest.trim()) return;

    const remoteFile =
      currentPath === "." || currentPath === "/"
        ? `/${selectedFile}`
        : `${currentPath}/${selectedFile}`;

    try {
      setStatusNotice(`Descargando ${selectedFile}...`);
      await invoke("download_sftp_file", {
        connectionId: connection.id,
        remoteFilePath: remoteFile,
        localDestinationPath: localDest.trim(),
        manualPassword: manualPassword || null,
      });

      setStatusNotice(`¡Archivo ${selectedFile} guardado en ${localDest.trim()}!`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: unknown) {
      setErrorNotice(`Falló la descarga de archivo: ${(err as Error).message || String(err)}`);
    }
  };

  const handleMkdir = async () => {
    const folderName = prompt("Nombre de la nueva carpeta remota:");
    if (!folderName || !folderName.trim()) return;

    const targetFolderPath =
      currentPath === "." || currentPath === "/"
        ? `/${folderName.trim()}`
        : `${currentPath}/${folderName.trim()}`;

    try {
      setStatusNotice(`Creando carpeta ${folderName}...`);
      await invoke("create_sftp_dir", {
        connectionId: connection.id,
        path: targetFolderPath,
        manualPassword: manualPassword || null,
      });
      setStatusNotice(`Carpeta '${folderName.trim()}' creada.`);
      setTimeout(() => setStatusNotice(null), 3000);
      loadDirectory(currentPath);
    } catch (err: unknown) {
      setErrorNotice(`Error al crear carpeta: ${(err as Error).message || String(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile || selectedFile === "..") return;
    const targetItem = files.find((f) => f.name === selectedFile);
    if (!targetItem) return;

    if (confirm(`¿Está seguro de eliminar '${selectedFile}' en el servidor remoto?`)) {
      const fullPath =
        currentPath === "." || currentPath === "/"
          ? `/${selectedFile}`
          : `${currentPath}/${selectedFile}`;

      try {
        setStatusNotice(`Eliminando ${selectedFile}...`);
        await invoke("delete_sftp_item", {
          connectionId: connection.id,
          path: fullPath,
          isDir: targetItem.isDir,
          manualPassword: manualPassword || null,
        });
        setSelectedFile(null);
        setStatusNotice(`Elemento eliminado correctamente.`);
        setTimeout(() => setStatusNotice(null), 3000);
        loadDirectory(currentPath);
      } catch (err: unknown) {
        setErrorNotice(`Error al eliminar elemento: ${(err as Error).message || String(err)}`);
      }
    }
  };

  const handleManualPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPassword.trim()) {
      loadDirectory(currentPath, manualPassword.trim());
    }
  };

  const pathParts = currentPath.split("/").filter((p) => p && p !== ".");

  return (
    <div className="flex flex-col h-full bg-[#0A1120] text-slate-100 font-sans rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-slate-800 select-none">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Regresar a Conexiones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">{connection.name}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                SFTP Real Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {connection.username}@{connection.host}:{connection.port || 22}
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerUpload}
            disabled={loading || manualPasswordPrompt}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Archivo</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!selectedFile || loading || manualPasswordPrompt}
            className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
              selectedFile && !loading && !manualPasswordPrompt
                ? "bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border-sky-500/30"
                : "bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          <button
            onClick={handleMkdir}
            disabled={loading || manualPasswordPrompt}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={!selectedFile || selectedFile === ".." || loading || manualPasswordPrompt}
            className={`p-1.5 border rounded-lg transition-colors ${
              selectedFile && selectedFile !== ".." && !loading && !manualPasswordPrompt
                ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/30"
                : "bg-slate-800/40 text-slate-600 border-slate-700/30 cursor-not-allowed"
            }`}
            title="Eliminar elemento seleccionado"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => loadDirectory(currentPath)}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            title="Refrescar directorio"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center px-4 py-2 bg-[#0B1324] border-b border-slate-800/80 text-xs font-mono select-none">
        <HardDrive className="w-3.5 h-3.5 text-slate-400 mr-2" />
        <button
          onClick={() => setCurrentPath("/")}
          className="text-slate-400 hover:text-cyan-400 transition-colors"
        >
          root
        </button>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 mx-1" />
            <button
              onClick={() => setCurrentPath("/" + pathParts.slice(0, index + 1).join("/"))}
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Manual Password Prompt Modal Overlay */}
      {manualPasswordPrompt && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between select-none">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-200">Autenticación Requerida</p>
              <p className="text-[11px] text-amber-300/80">
                Ingrese la contraseña SSH/SFTP para {connection.username}@{connection.host}
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
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Conectar
            </button>
          </form>
        </div>
      )}

      {/* Status Notice */}
      {statusNotice && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-1.5 text-xs text-cyan-300 animate-fadeIn">
          {statusNotice}
        </div>
      )}

      {/* Error Notice */}
      {errorNotice && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-rose-400 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Remote File Table */}
      <div className="flex-1 overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-[#0A1120]/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Conectando y leyendo servidor remoto...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Nombre</th>
              <th className="py-2.5 px-4 font-semibold w-28">Tamaño</th>
              <th className="py-2.5 px-4 font-semibold w-32">Permisos</th>
              <th className="py-2.5 px-4 font-semibold w-40">Modificado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {files.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                  Directorio vacío o sin elementos disponibles.
                </td>
              </tr>
            ) : (
              files.map((file) => {
                const isSelected = selectedFile === file.name;
                return (
                  <tr
                    key={file.name}
                    onClick={() => setSelectedFile(file.name)}
                    onDoubleClick={() => handleOpenFolder(file)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cyan-500/15 text-cyan-200"
                        : "hover:bg-slate-800/40 text-slate-200"
                    }`}
                  >
                    <td className="py-2 px-4 flex items-center space-x-2.5">
                      {getFileIcon(file)}
                      <span className={file.isDir ? "font-semibold text-slate-100" : "text-slate-300"}>
                        {file.name}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-400">{formatSize(file.size, file.isDir)}</td>
                    <td className="py-2 px-4 text-slate-500 text-[11px]">{file.permissions}</td>
                    <td className="py-2 px-4 text-slate-400 text-[11px]">{file.modified}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
