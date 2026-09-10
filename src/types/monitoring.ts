export interface ServerPingResult {
  connectionId: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  isOnline: boolean;
  latencyMs: number;
  error?: string | null;
}

export interface MonitoringStats {
  total: number;
  online: number;
  offline: number;
  avgLatencyMs: number;
}

export type AutoRefreshInterval = "OFF" | "5s" | "15s" | "30s" | "60s";
