import { safeInvoke } from "./client";
import { Connection, CreateConnectionPayload, UpdateConnectionPayload } from "@/types/connection";

export const connectionService = {
  async list(): Promise<Connection[]> {
    return safeInvoke<Connection[]>("list_connections");
  },

  async get(id: string): Promise<Connection> {
    return safeInvoke<Connection>("get_connection", { id });
  },

  async create(payload: CreateConnectionPayload): Promise<Connection> {
    return safeInvoke<Connection>("create_connection", { payload });
  },

  async update(id: string, payload: UpdateConnectionPayload): Promise<Connection> {
    return safeInvoke<Connection>("update_connection", { id, payload });
  },

  async delete(id: string): Promise<void> {
    return safeInvoke<void>("delete_connection", { id });
  },

  async duplicate(id: string): Promise<Connection> {
    return safeInvoke<Connection>("duplicate_connection", { id });
  },

  async toggleFavorite(connection: Connection): Promise<Connection> {
    return safeInvoke<Connection>("update_connection", {
      id: connection.id,
      payload: { favorite: !connection.favorite },
    });
  },
};
