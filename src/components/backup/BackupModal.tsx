import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { backupService } from "@/services/tauri/backup";
import { ImportSummary } from "@/types/backup";
import {
  Download,
  Upload,
  ShieldCheck,
  KeyRound,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCode,
  Sparkles,
} from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAll: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshAll,
}) => {
  const [activeTab, setActiveTab] = useState<"EXPORT" | "IMPORT">("EXPORT");

  // Export State
  const [exportPassword, setExportPassword] = useState("");
  const [useEncryption, setUseEncryption] = useState(true);
  const [includeSecrets, setIncludeSecrets] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importContent, setImportContent] = useState<string>("");
  const [importPassword, setImportPassword] = useState("");
  const [isEncryptedFile, setIsEncryptedFile] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleExport = async () => {
    if (useEncryption && !exportPassword.trim()) {
      alert("Por favor ingresa una contraseña para proteger tu archivo de respaldo .zyntra");
      return;
    }

    setExportLoading(true);
    setExportSuccess(false);
    try {
      const data = await backupService.exportBackup(
        useEncryption ? exportPassword.trim() : undefined,
        includeSecrets
      );

      // Create downloadable Blob
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = useEncryption ? "zyntra" : "json";
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `zyntratek-backup-${dateStr}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || "Error al exportar respaldo");
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportSummary(null);

    const isZyntra = file.name.endsWith(".zyntra");
    setIsEncryptedFile(isZyntra);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
      if (content.includes("zyntra-encrypted-v1")) {
        setIsEncryptedFile(true);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importContent) {
      setImportError("Por favor selecciona un archivo de respaldo válido.");
      return;
    }

    if (isEncryptedFile && !importPassword.trim()) {
      setImportError("Ingresa la contraseña de descifrado para este respaldo .zyntra.");
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportSummary(null);

    try {
      const summary = await backupService.importBackup(
        importContent,
        isEncryptedFile ? importPassword.trim() : undefined
      );
      setImportSummary(summary);
      onRefreshAll();
    } catch (err: unknown) {
      setImportError((err as Error).message || "Error al importar el respaldo.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Copia de Seguridad y Exportación 💾"
    >
      <div className="space-y-4 text-foreground select-none">
        {/* Navigation Tabs */}
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => {
              setActiveTab("EXPORT");
              setImportError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "EXPORT"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="h-4 w-4" />
            Exportar Respaldo
          </button>
          <button
            onClick={() => {
              setActiveTab("IMPORT");
              setImportError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "IMPORT"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-4 w-4" />
            Restaurar / Importar
          </button>
        </div>

        {/* Tab 1: Export */}
        {activeTab === "EXPORT" && (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-[#080E1A] rounded-xl border border-border/80 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Respaldo completo de Zyntratek
              </p>
              <p>
                Exporta todas tus conexiones (SSH, SFTP, RDP, VNC, Web), credenciales de la bóveda, carpetas, etiquetas y comandos rápidos (snippets).
              </p>
            </div>

            {/* Encryption toggle */}
            <div className="space-y-3 p-3 bg-secondary/30 rounded-xl border border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Cifrado AES-256 Militar (.zyntra)
                </span>
              </label>

              {useEncryption ? (
                <div className="space-y-1.5 pl-6">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Contraseña de Cifrado *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="password"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      placeholder="Crea una contraseña segura para tu archivo..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-amber-400/90 pl-6 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  El archivo se exportará en texto plano JSON estándar.
                </p>
              )}
            </div>

            {/* Include secrets checkbox */}
            <div className="p-3 bg-secondary/30 rounded-xl border border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSecrets}
                  onChange={(e) => setIncludeSecrets(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Incluir secretos y contraseñas de la bóveda
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Si se desmarca, las conexiones se exportarán sin contraseñas (ideal para compartir con tu equipo).
                  </span>
                </div>
              </label>
            </div>

            {exportSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>¡Archivo de respaldo generado y descargado con éxito!</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Descargar Archivo de Respaldo</span>
            </button>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === "IMPORT" && (
          <div className="space-y-4 pt-1">
            {/* File Picker */}
            <div className="p-4 border-2 border-dashed border-border hover:border-primary/60 rounded-xl text-center cursor-pointer relative bg-secondary/20 transition-all">
              <input
                type="file"
                accept=".zyntra,.json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                {importFile ? (
                  <>
                    <FileCode className="h-8 w-8 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {importFile.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <FileJson className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Selecciona un archivo .zyntra o .json
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Haz clic aquí o arrastra tu archivo de respaldo
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Password input if encrypted */}
            {isEncryptedFile && (
              <div className="p-3 bg-secondary/30 rounded-xl border border-border space-y-1.5">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Contraseña de Descifrado *
                </label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Ingresa la contraseña del archivo .zyntra..."
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Error banner */}
            {importError && (
              <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-xl text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success Summary */}
            {importSummary && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>¡Respaldo importado y restaurado con éxito!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-foreground font-medium pt-1">
                  <div>📁 Carpetas: {importSummary.foldersImported}</div>
                  <div>🏷️ Etiquetas: {importSummary.tagsImported}</div>
                  <div>🖥️ Conexiones: {importSummary.connectionsImported}</div>
                  <div>🔐 Credenciales: {importSummary.credentialsImported}</div>
                  <div className="col-span-2">⚡ Comandos Rápidos: {importSummary.snippetsImported}</div>
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importLoading || !importContent}
              className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {importLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Restaurar Datos en Zyntratek</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
