import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Snippet, CreateSnippetPayload, UpdateSnippetPayload } from "@/types/snippet";
import { Zap, Code, Folder, FileText, Loader2 } from "lucide-react";

interface SnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateSnippetPayload | UpdateSnippetPayload) => Promise<void>;
  snippet?: Snippet | null;
}

export const SnippetModal: React.FC<SnippetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  snippet,
}) => {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (snippet) {
      setName(snippet.name);
      setCommand(snippet.command);
      setCategory(snippet.category || "General");
      setDescription(snippet.description || "");
    } else {
      setName("");
      setCommand("");
      setCategory("General");
      setDescription("");
    }
    setError(null);
  }, [snippet, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del comando es obligatorio");
      return;
    }
    if (!command.trim()) {
      setError("El comando es obligatorio");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        command: command.trim(),
        category: category.trim() || "General",
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error).message || "Error al guardar el comando";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={snippet ? "Editar Comando Rápido ⚡" : "Nuevo Comando Rápido ⚡"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-destructive/15 border border-destructive/30 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Nombre del Comando *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Reiniciar Nginx"
            className="w-full px-3 py-2 text-xs bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Code className="h-3.5 w-3.5 text-primary" />
            Comando / Script Shell *
          </label>
          <textarea
            required
            rows={3}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="ej. sudo systemctl restart nginx && sudo systemctl status nginx"
            className="w-full p-2.5 text-xs font-mono bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-cyan-400" />
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Docker, Red, Sistema, etc."
              className="w-full px-3 py-2 text-xs bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Descripción (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve..."
              className="w-full px-3 py-2 text-xs bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{snippet ? "Guardar Cambios" : "Crear Comando"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
