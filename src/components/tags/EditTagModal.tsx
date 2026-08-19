import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tag } from "@/types/connection";
import { Trash2 } from "lucide-react";

interface EditTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onUpdate: (id: string, name: string, color?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  "#64748b", // Slate
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

export const EditTagModal: React.FC<EditTagModalProps> = ({
  isOpen,
  onClose,
  tag,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color || "#3b82f6");
      setError(null);
    }
  }, [tag, isOpen]);

  if (!tag) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la etiqueta es obligatorio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(tag.id, name.trim(), color);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudo actualizar la etiqueta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de eliminar la etiqueta "${tag.name}"? Se removerá de todas las conexiones asignadas.`)) {
      setDeleting(true);
      setError(null);
      try {
        await onDelete(tag.id);
        onClose();
      } catch (err: unknown) {
        setError((err as Error).message || "No se pudo eliminar la etiqueta.");
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Etiqueta (Tag)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nombre de la Etiqueta *
          </label>
          <input
            type="text"
            placeholder="ej. production, linux, critical, k8s"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Vista previa en tiempo real */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Vista Previa:</span>
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold border"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
              color: color,
            }}
          >
            🏷️ {name.trim() || "Etiqueta"}
          </span>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Eliminar Etiqueta"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || deleting}
              className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
