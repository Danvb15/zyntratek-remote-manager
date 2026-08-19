import { invoke } from "@tauri-apps/api/core";
import { CreateSnippetPayload, Snippet, UpdateSnippetPayload } from "@/types/snippet";

export const snippetService = {
  getAll: async (): Promise<Snippet[]> => {
    return invoke<Snippet[]>("get_all_snippets");
  },

  create: async (payload: CreateSnippetPayload): Promise<Snippet> => {
    return invoke<Snippet>("create_snippet", { payload });
  },

  update: async (id: string, payload: UpdateSnippetPayload): Promise<Snippet> => {
    return invoke<Snippet>("update_snippet", { id, payload });
  },

  delete: async (id: string): Promise<void> => {
    return invoke<void>("delete_snippet", { id });
  },
};
