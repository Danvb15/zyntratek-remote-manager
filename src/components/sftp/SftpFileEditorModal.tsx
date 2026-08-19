import React, { useState, useEffect, useRef } from "react";
import {
  FileCode,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Server,
  Monitor,
} from "lucide-react";

interface SftpFileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  isRemote: boolean;
  initialContent: string;
  onSave: (newContent: string) => Promise<void>;
}

export const SftpFileEditorModal: React.FC<SftpFileEditorModalProps> = ({
  isOpen,
  onClose,
  filePath,
  fileName,
  isRemote,
  initialContent,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setSaveSuccess(false);
    setError(null);
  }, [initialContent, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await onSave(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Error al guardar el archivo";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S / Cmd+S -> Guardar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
    }
    // Tab key indent support
    else if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  if (!isOpen) return null;

  const lines = content.split("\n");
  const lineCount = lines.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B111E] border border-border/80 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-foreground">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#070B14] border-b border-border/70 select-none">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
              <FileCode className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">{fileName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase flex items-center gap-1 ${
                    isRemote
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {isRemote ? (
                    <>
                      <Server className="h-3 w-3" /> Remoto SFTP
                    </>
                  ) : (
                    <>
                      <Monitor className="h-3 w-3" /> Local Windows
                    </>
                  )}
                </span>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                    <CheckCircle className="h-3.5 w-3.5" /> Guardado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono">{filePath}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xs"
              title="Guardar archivo (Ctrl+S)"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Guardar (Ctrl+S)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Cerrar editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-4 py-2 bg-destructive/15 border-b border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Editor Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-[#060A12]">
          {/* Line Numbers column */}
          <div className="w-12 py-3 bg-[#080D18] border-r border-border/40 text-right pr-3 select-none text-[12px] font-mono text-muted-foreground/60 overflow-hidden shrink-0">
            {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
              <div key={i} className="leading-[1.5rem] h-[1.5rem]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="flex-1 w-full h-full p-3 bg-transparent text-[#E2E8F0] font-mono text-[12.5px] leading-[1.5rem] resize-none outline-none border-none overflow-auto select-text scrollbar-thin placeholder:text-muted-foreground/40"
            placeholder="Archivo vacío..."
          />
        </div>

        {/* Editor Bottom Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#070B14] border-t border-border/70 text-[11px] text-muted-foreground font-mono select-none">
          <div className="flex items-center gap-4">
            <span>Líneas: {lineCount}</span>
            <span>Caracteres: {content.length}</span>
            <span>Codificación: UTF-8</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px]">Ctrl+S</kbd> Guardar
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] ml-2">Tab</kbd> Indentar
          </div>
        </div>
      </div>
    </div>
  );
};
