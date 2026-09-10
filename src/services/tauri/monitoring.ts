import { invoke } from "@tauri-apps/api/core";
import { ServerPingResult } from "@/types/monitoring";

export const monitoringService = {
  checkAllServersPing: async (timeoutMs?: number): Promise<ServerPingResult[]> => {
    return await invoke<ServerPingResult[]>("check_all_servers_ping", {
      timeoutMs: timeoutMs ?? 2500,
    });
  },

  checkSingleServerPing: async (
    connectionId: string,
    host: string,
    port: number,
    name?: string,
    protocol?: string,
    timeoutMs?: number
  ): Promise<ServerPingResult> => {
    return await invoke<ServerPingResult>("check_single_server_ping", {
      connectionId,
      host,
      port,
      name: name ?? null,
      protocol: protocol ?? null,
      timeoutMs: timeoutMs ?? 2500,
    });
  },
};
