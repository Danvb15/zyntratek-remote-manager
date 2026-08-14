import { useState, useEffect, useCallback } from "react";
import { Folder } from "@/types/folder";
import { folderService } from "@/services/tauri/folders";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await folderService.list();
      setFolders(data);
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudieron cargar las carpetas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string, parentId?: string) => {
    const created = await folderService.create(name, parentId);
    setFolders((prev) => [...prev, created]);
    return created;
  };

  const deleteFolder = async (id: string) => {
    await folderService.delete(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    folders,
    loading,
    error,
    refresh: fetchFolders,
    createFolder,
    deleteFolder,
  };
}
