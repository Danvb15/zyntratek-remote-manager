import { safeInvoke } from "./client";
import { Channel } from "@tauri-apps/api/core";

export interface SshEventData {
  type: "output" | "status" | "error" | "exit";
  payload: number[] | string | number;
}

export const sshService = {
  async startSession(
    connectionId: string,
    cols: number,
    rows: number,
    onEvent: (event: SshEventData) => void,
    manualPassword?: string
  ): Promise<string> {
    const channel = new Channel<SshEventData>();
    channel.onmessage = onEvent;

    return safeInvoke<string>("start_ssh_session", {
      connectionId,
      cols,
      rows,
      manualPassword: manualPassword || null,
      onEvent: channel,
    });
  },


  async sendInput(sessionId: string, data: Uint8Array): Promise<void> {
    return safeInvoke<void>("send_ssh_input", {
      sessionId,
      data: Array.from(data),
    });
  },

  async resizePty(sessionId: string, cols: number, rows: number): Promise<void> {
    return safeInvoke<void>("resize_ssh_pty", {
      sessionId,
      cols,
      rows,
    });
  },

  async disconnect(sessionId: string): Promise<void> {
    return safeInvoke<void>("disconnect_ssh_session", {
      sessionId,
    });
  },

  async trustHost(host: string, port: number, keyType: string, fingerprint: string): Promise<void> {
    return safeInvoke<void>("trust_ssh_host", {
      host,
      port,
      keyType,
      fingerprint,
    });
  },
};
