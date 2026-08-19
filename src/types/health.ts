export interface ServerHealthMetrics {
  uptime: string;
  loadAverage: string;
  cpuCores: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryPercent: number;
  diskUsed: string;
  diskTotal: string;
  diskPercent: string;
  osInfo: string;
  pingMs: number;
}
