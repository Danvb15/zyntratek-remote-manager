import { safeInvoke } from "./client";
import { Folder } from "@/types/folder";

export const folderService = {
  async list(): Promise<Folder[]> {
    return safeInvoke<Folder[]>("list_folders");
  },

  async create(name: string, parentId?: string): Promise<Folder> {
    return safeInvoke<Folder>("create_folder", { name, parentId: parentId || null });
  },

  async delete(id: string): Promise<void> {
    return safeInvoke<void>("delete_folder", { id });
  },
};
