import React from "react";
import { Connection } from "@/types/connection";
import { ConnectionCard } from "./ConnectionCard";
import { Terminal, Plus } from "lucide-react";

interface ConnectionListProps {
  connections: Connection[];
  loading: boolean;
  onConnect: (conn: Connection) => void;
  onEdit: (conn: Connection) => void;
  onDuplicate: (conn: Connection) => void;
  onDelete: (conn: Connection) => void;
  onToggleFavorite: (conn: Connection) => void;
  onCreateNew: () => void;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
  connections,
  loading,
  onConnect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onCreateNew,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-card/40 border border-border/50 rounded-xl p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-secondary rounded-md w-3/4" />
                <div className="h-3 bg-secondary/70 rounded-md w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-secondary/50 rounded-md w-1/3" />
            <div className="h-8 bg-secondary/40 rounded-lg w-full pt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card/30 space-y-4">
        <div className="h-16 w-16 bg-secondary/80 text-muted-foreground rounded-2xl flex items-center justify-center">
          <Terminal className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-semibold text-base text-foreground">No se encontraron conexiones</h3>
          <p className="text-xs text-muted-foreground">
            No existen conexiones guardadas o ninguna coincide con los filtros aplicados.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Crear Conexión Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {connections.map((conn) => (
        <ConnectionCard
          key={conn.id}
          connection={conn}
          onConnect={onConnect}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
