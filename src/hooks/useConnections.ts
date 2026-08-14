import { useState, useEffect, useCallback, useMemo } from "react";
import { Connection, CreateConnectionPayload, Protocol, UpdateConnectionPayload } from "@/types/connection";
import { connectionService } from "@/services/tauri/connections";

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<Protocol | "ALL">("ALL");
  const [favoriteFilter, setFavoriteFilter] = useState<"ALL" | "FAVORITES">("ALL");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await connectionService.list();
      setConnections(data);
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudieron cargar las conexiones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const createConnection = async (payload: CreateConnectionPayload) => {
    const created = await connectionService.create(payload);
    setConnections((prev) => [...prev, created]);
    return created;
  };

  const updateConnection = async (id: string, payload: UpdateConnectionPayload) => {
    const updated = await connectionService.update(id, payload);
    setConnections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteConnection = async (id: string) => {
    await connectionService.delete(id);
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const duplicateConnection = async (id: string) => {
    const duplicated = await connectionService.duplicate(id);
    setConnections((prev) => [...prev, duplicated]);
    return duplicated;
  };

  const toggleFavorite = async (connection: Connection) => {
    const updated = await connectionService.toggleFavorite(connection);
    setConnections((prev) => prev.map((c) => (c.id === connection.id ? updated : c)));
  };

  // Filtered connections computation
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      // Protocol filter
      if (protocolFilter !== "ALL" && conn.protocol !== protocolFilter) {
        return false;
      }
      // Favorite filter
      if (favoriteFilter === "FAVORITES" && !conn.favorite) {
        return false;
      }
      // Folder filter
      if (folderFilter && conn.folderId !== folderFilter) {
        return false;
      }
      // Tag filter
      if (selectedTagId && !conn.tags.some((t) => t.id === selectedTagId)) {
        return false;
      }
      // Text search query (Name, Host, Username, Protocol)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = conn.name.toLowerCase().includes(q);
        const hostMatch = conn.host.toLowerCase().includes(q);
        const userMatch = conn.username.toLowerCase().includes(q);
        const protoMatch = conn.protocol.toLowerCase().includes(q);
        const tagMatch = conn.tags.some((t) => t.name.toLowerCase().includes(q));
        return nameMatch || hostMatch || userMatch || protoMatch || tagMatch;
      }
      return true;
    });
  }, [connections, searchQuery, protocolFilter, favoriteFilter, folderFilter, selectedTagId]);

  return {
    connections: filteredConnections,
    totalConnections: connections.length,
    loading,
    error,
    refresh: fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    duplicateConnection,
    toggleFavorite,
    // Filters & Setters
    searchQuery,
    setSearchQuery,
    protocolFilter,
    setProtocolFilter,
    favoriteFilter,
    setFavoriteFilter,
    folderFilter,
    setFolderFilter,
    selectedTagId,
    setSelectedTagId,
  };
}
