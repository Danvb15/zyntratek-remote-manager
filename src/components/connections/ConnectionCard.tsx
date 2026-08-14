import React from "react";
import { Connection } from "@/types/connection";
import { Badge } from "@/components/ui/Badge";
import { Terminal, Monitor, Globe, Star, Copy, Edit2, Trash2, Play } from "lucide-react";

interface ConnectionCardProps {
  connection: Connection;
  onConnect: (conn: Connection) => void;
  onEdit: (conn: Connection) => void;
  onDuplicate: (conn: Connection) => void;
  onDelete: (conn: Connection) => void;
  onToggleFavorite: (conn: Connection) => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onConnect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}) => {
  const isSSH = connection.protocol === "SSH";
  const isRDP = connection.protocol === "RDP";

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isSSH
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isRDP
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
            }`}
          >
            {isSSH ? (
              <Terminal className="h-5 w-5" />
            ) : isRDP ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <Globe className="h-5 w-5" />
            )}
          </div>



          <div>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {connection.name}
            </h3>
            <p className="text-xs font-mono text-muted-foreground">
              {connection.username}@{connection.host}:{connection.port}
            </p>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(connection)}
          className={`p-1.5 rounded-lg transition-colors ${
            connection.favorite
              ? "text-amber-400 hover:bg-amber-400/10"
              : "text-muted-foreground hover:text-amber-400 hover:bg-secondary"
          }`}
          title={connection.favorite ? "Quitar de favoritos" : "Marcar como favorito"}
        >
          <Star className={`h-4 w-4 ${connection.favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Tags Section */}
      {connection.tags && connection.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 my-3">
          {connection.tags.map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-xs border border-border">
          {connection.protocol}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(connection)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
            title="Duplicar conexión"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(connection)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
            title="Editar conexión"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(connection)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Eliminar conexión"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onConnect(connection)}
            className="ml-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Play className="h-3 w-3 fill-current" />
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
};
