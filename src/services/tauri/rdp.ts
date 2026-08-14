import { safeInvoke } from "./client";

export interface RdpSessionDto {
  id: string;
  connectionId: string;
  host: string;
  port: number;
  username: string;
  status: "starting" | "running" | "exited" | "error";
  createdAt: string;
}

export const rdpService = {
  async startSession(connectionId: string): Promise<string> {
    return safeInvoke<string>("start_rdp_session", { connectionId });
  },

  async listSessions(): Promise<RdpSessionDto[]> {
    return safeInvoke<RdpSessionDto[]>("list_rdp_sessions");
  },

  async disconnect(sessionId: string): Promise<void> {
    return safeInvoke<void>("disconnect_rdp_session", { sessionId });
  },
};
