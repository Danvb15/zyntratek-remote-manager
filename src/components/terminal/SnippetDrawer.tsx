import React, { useState } from "react";
import { Snippet, CreateSnippetPayload, UpdateSnippetPayload } from "@/types/snippet";
import { useSnippets } from "@/hooks/useSnippets";
import { SnippetModal } from "./SnippetModal";
import {
  Zap,
  Play,
  Copy,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
} from "lucide-react";

interface SnippetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSnippet: (command: string) => void;
}

export const SnippetDrawer: React.FC<SnippetDrawerProps> = ({
  isOpen,
  onClose,
  onRunSnippet,
}) => {
  const { snippets, loading, createSnippet, updateSnippet, deleteSnippet } = useSnippets();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = Array.from(new Set(snippets.map((s) => s.category || "General")));

  const filteredSnippets = snippets.filter((s) => {
    const matchesCat = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.command.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingSnippet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Snippet) => {
    setEditingSnippet(s);
    setIsModalOpen(true);
  };

  const handleSaveSnippet = async (payload: CreateSnippetPayload | UpdateSnippetPayload) => {
    if (editingSnippet) {
      await updateSnippet(editingSnippet.id, payload as UpdateSnippetPayload);
    } else {
      await createSnippet(payload as CreateSnippetPayload);
    }
  };

  return (
    <div className="w-80 h-full bg-[#080D1A] border-l border-border/80 flex flex-col z-20 shrink-0 text-foreground animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="p-3 bg-[#060A14] border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Comandos Rápidos</h3>
            <p className="text-[10px] text-muted-foreground">Ejecución con 1 clic en terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenCreate}
            className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
            title="Nuevo comando"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Cerrar panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="p-2.5 space-y-2 border-b border-border/50 bg-[#070B16]">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comando o script..."
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-secondary/40 border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Cargando snippets...
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground italic">
            No se encontraron comandos
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="group bg-[#0A1020] border border-border/60 hover:border-border rounded-lg p-2.5 transition-all shadow-2xs hover:shadow-xs flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {s.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary/80 text-muted-foreground font-mono">
                      {s.category}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                      {s.description}
                    </p>
                  )}
                </div>

                {/* Card Quick Actions */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                  <button
                    onClick={() => handleCopy(s.id, s.command)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Copiar comando al portapapeles"
                  >
                    {copiedId === s.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Editar comando"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar comando "${s.name}"?`)) {
                        deleteSnippet(s.id);
                      }
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar comando"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Shell code snippet display */}
              <div className="p-1.5 bg-[#050811] rounded border border-border/40 font-mono text-[11px] text-emerald-300/90 break-all select-text flex items-center justify-between gap-1">
                <span className="truncate">{s.command}</span>
              </div>

              {/* Big Run Button */}
              <button
                onClick={() => onRunSnippet(s.command)}
                className="w-full py-1 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Ejecutar en la terminal activa inmediatamente"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Ejecutar en Terminal</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#060A14] border-t border-border/60 text-[10px] text-muted-foreground text-center font-mono">
        💡 Clic en "Ejecutar" envía el comando a la sesión SSH activa.
      </div>

      {/* Modal Crear / Editar */}
      <SnippetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSnippet}
        snippet={editingSnippet}
      />
    </div>
  );
};
