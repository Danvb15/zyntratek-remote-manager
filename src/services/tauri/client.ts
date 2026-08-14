import { invoke } from "@tauri-apps/api/core";

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error: unknown) {
    const message = typeof error === "string" ? error : (error as Error)?.message || "Ocurrió un error inesperado";
    console.error(`[IPC Error] Command '${cmd}' failed:`, message);
    throw new Error(message);
  }
}
