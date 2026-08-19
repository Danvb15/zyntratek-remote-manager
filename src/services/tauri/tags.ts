import { safeInvoke } from "./client";
import { Tag } from "@/types/connection";

export const tagService = {
  async list(): Promise<Tag[]> {
    return safeInvoke<Tag[]>("list_tags");
  },

  async create(name: string, color?: string): Promise<Tag> {
    return safeInvoke<Tag>("create_tag", { name, color: color || "#64748b" });
  },

  async update(id: string, name: string, color?: string): Promise<Tag> {
    return safeInvoke<Tag>("update_tag", { id, name, color: color || "#64748b" });
  },

  async delete(id: string): Promise<void> {
    return safeInvoke<void>("delete_tag", { id });
  },
};
