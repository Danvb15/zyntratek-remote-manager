import { useState, useEffect, useCallback } from "react";
import { CreateSnippetPayload, Snippet, UpdateSnippetPayload } from "@/types/snippet";
import { snippetService } from "@/services/tauri/snippets";

const DEFAULT_SNIPPETS: CreateSnippetPayload[] = [
  {
    name: "Contenedores Activos",
    command: "docker ps",
    category: "Docker",
    description: "Lista todos los contenedores Docker en ejecución",
  },
  {
    name: "Estadísticas de Docker",
    command: "docker stats --no-stream",
    category: "Docker",
    description: "Muestra consumo de CPU, RAM y red de contenedores",
  },
  {
    name: "Monitor htop",
    command: "htop",
    category: "Sistema",
    description: "Abre el monitor interactivo de procesos y memoria",
  },
  {
    name: "Espacio en Disco y RAM",
    command: "df -h && echo '--- RAM ---' && free -h",
    category: "Sistema",
    description: "Revisa almacenamiento en particiones y memoria libre",
  },
  {
    name: "Puertos en Escucha",
    command: "ss -tulpn",
    category: "Red",
    description: "Muestra sockets y puertos TCP/UDP abiertos",
  },
  {
    name: "Direcciones IP",
    command: "ip -br a",
    category: "Red",
    description: "Lista interfaces de red y sus direcciones IP",
  },
  {
    name: "Estado de Nginx / Web",
    command: "systemctl status nginx --no-pager",
    category: "Servicios",
    description: "Verifica el servicio del servidor web Nginx",
  },
  {
    name: "Actualizar Paquetes (Debian/Ubuntu)",
    command: "sudo apt update && sudo apt upgrade -y",
    category: "Mantenimiento",
    description: "Actualiza repositorios y paquetes instalados",
  },
];

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list = await snippetService.getAll();
      // Si la base de datos está vacía, sembramos los snippets por defecto
      if (list.length === 0) {
        for (const def of DEFAULT_SNIPPETS) {
          await snippetService.create(def);
        }
        list = await snippetService.getAll();
      }
      setSnippets(list);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Error al cargar los comandos rápidos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const createSnippet = async (payload: CreateSnippetPayload) => {
    const created = await snippetService.create(payload);
    await fetchSnippets();
    return created;
  };

  const updateSnippet = async (id: string, payload: UpdateSnippetPayload) => {
    const updated = await snippetService.update(id, payload);
    await fetchSnippets();
    return updated;
  };

  const deleteSnippet = async (id: string) => {
    await snippetService.delete(id);
    await fetchSnippets();
  };

  return {
    snippets,
    loading,
    error,
    refresh: fetchSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
  };
}
