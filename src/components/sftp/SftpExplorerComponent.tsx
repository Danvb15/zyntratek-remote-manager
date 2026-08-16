import React, { useState } from "react";
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

const INITIAL_FILES: SftpItem[] = [
  { name: "..", isDir: true, size: 0, permissions: "drwxr-xr-x", modified: "2026-08-16 10:00" },
  { name: "etc", isDir: true, size: 4096, permissions: "drwxr-xr-x", modified: "2026-08-16 09:30" },
  { name: "var", isDir: true, size: 4096, permissions: "drwxr-xr-x", modified: "2026-08-16 08:45" },
  { name: "www", isDir: true, size: 4096, permissions: "drwxr-xr-x", modified: "2026-08-16 11:20" },
  { name: "config.nginx", isDir: false, size: 1842, permissions: "-rw-r--r--", modified: "2026-08-15 16:10" },
  { name: "app.log", isDir: false, size: 248910, permissions: "-rw-r--r--", modified: "2026-08-16 12:15" },
  { name: "docker-compose.yml", isDir: false, size: 754, permissions: "-rw-r--r--", modified: "2026-08-14 18:00" },
];

export const SftpExplorerComponent: React.FC<SftpExplorerComponentProps> = ({
  connection,
  onBack,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("/var/www/html");
  const [files, setFiles] = useState<SftpItem[]>(INITIAL_FILES);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

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
    if (item.name.endsWith(".yml") || item.name.endsWith(".nginx") || item.name.endsWith(".json")) {
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
      setCurrentPath("/" + parts.join("/"));
    } else {
      setCurrentPath(currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`);
    }
    setSelectedFile(null);
  };

  const handleUpload = () => {
    setStatusNotice("Seleccione un archivo local para subir al servidor remoto...");
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleDownload = () => {
    if (!selectedFile) {
      setStatusNotice("Por favor seleccione un archivo para descargar.");
      setTimeout(() => setStatusNotice(null), 3000);
      return;
    }
    setStatusNotice(`Descargando ${selectedFile} a su equipo local...`);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleMkdir = () => {
    const folderName = prompt("Nombre de la nueva carpeta remota:");
    if (folderName && folderName.trim()) {
      const newItem: SftpItem = {
        name: folderName.trim(),
        isDir: true,
        size: 4096,
        permissions: "drwxr-xr-x",
        modified: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      setFiles((prev) => [...prev, newItem]);
      setStatusNotice(`Carpeta '${folderName.trim()}' creada en ${currentPath}`);
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleDelete = () => {
    if (!selectedFile) return;
    if (confirm(`¿Eliminar '${selectedFile}' en el servidor remoto?`)) {
      setFiles((prev) => prev.filter((f) => f.name !== selectedFile));
      setSelectedFile(null);
      setStatusNotice(`Archivo/Carpeta eliminada correctamente.`);
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-[#0A1120] text-slate-100 font-sans rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header */}
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
                SFTP Explorer
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
            onClick={handleUpload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Archivo</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!selectedFile}
            className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
              selectedFile
                ? "bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border-sky-500/30"
                : "bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          <button
            onClick={handleMkdir}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={!selectedFile || selectedFile === ".."}
            className={`p-1.5 border rounded-lg transition-colors ${
              selectedFile && selectedFile !== ".."
                ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/30"
                : "bg-slate-800/40 text-slate-600 border-slate-700/30 cursor-not-allowed"
            }`}
            title="Eliminar elemento seleccionado"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFiles([...INITIAL_FILES])}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Refrescar directorio"
          >
            <RefreshCw className="w-4 h-4" />
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

      {/* Notification Status Banner */}
      {statusNotice && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-1.5 text-xs text-cyan-300 animate-fadeIn">
          {statusNotice}
        </div>
      )}

      {/* Main Remote File Table */}
      <div className="flex-1 overflow-y-auto">
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
            {files.map((file) => {
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
