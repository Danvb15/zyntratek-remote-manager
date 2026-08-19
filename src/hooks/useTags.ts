import { useState, useEffect, useCallback } from "react";
import { Tag } from "@/types/connection";
import { tagService } from "@/services/tauri/tags";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagService.list();
      setTags(data);
    } catch (err: unknown) {
      setError((err as Error).message || "No se pudieron cargar las etiquetas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string, color?: string) => {
    const created = await tagService.create(name, color);
    setTags((prev) => [...prev, created]);
    return created;
  };

  const updateTag = async (id: string, name: string, color?: string) => {
    const updated = await tagService.update(id, name, color);
    setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTag = async (id: string) => {
    await tagService.delete(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    tags,
    loading,
    error,
    refresh: fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
