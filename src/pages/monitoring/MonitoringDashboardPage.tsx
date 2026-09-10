import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Connection, Protocol } from "@/types/connection";
import { ServerPingResult, AutoRefreshInterval } from "@/types/monitoring";
import { monitoringService } from "@/services/tauri/monitoring";
import {
  Activity,
  RefreshCw,
  Server,
  CheckCircle2,
  XCircle,
  Zap,
  Search,
  Terminal,
  Monitor,
  FolderTree,
  Globe,
  Tv,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface MonitoringDashboardPageProps {
  connections: Connection[];
  onConnect: (connection: Connection) => void;
  onCheckHealth?: (connection: Connection) => void;
}

export const MonitoringDashboardPage: React.FC<MonitoringDashboardPageProps> = ({
  connections,
  onConnect,
  onCheckHealth,
}) => {
  const [results, setResults] = useState<Record<string, ServerPingResult>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [singleLoading, setSingleLoading] = useState<Record<string, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState<AutoRefreshInterval>("15s");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [filterProtocol, setFilterProtocol] = useState<"ALL" | Protocol>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Escanear todos los servidores en paralelo
  const scanAllServers = useCallback(async () => {
    if (connections.length === 0) return;
    setLoading(true);
    try {
      const pingResults = await monitoringService.checkAllServersPing(2500);
      const map: Record<string, ServerPingResult> = {};
      pingResults.forEach((r) => {
        map[r.connectionId] = r;
      });
      setResults((prev) => ({ ...prev, ...map }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error escaneando servidores:", err);
    } finally {
      setLoading(false);
    }
  }, [connections]);

  // Escaneo individual
  const scanSingleServer = async (conn: Connection) => {
    setSingleLoading((prev) => ({ ...prev, [conn.id]: true }));
    try {
      const res = await monitoringService.checkSingleServerPing(
        conn.id,
        conn.host,
        conn.port,
        conn.name,
        conn.protocol,
        2500
      );
      setResults((prev) => ({ ...prev, [conn.id]: res }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Error escaneando ${conn.name}:`, err);
    } finally {
      setSingleLoading((prev) => ({ ...prev, [conn.id]: false }));
    }
  };

  // Escanear al cargar el componente
  useEffect(() => {
    scanAllServers();
  }, [scanAllServers]);

  // Auto-refresco en vivo
  useEffect(() => {
    if (autoRefresh === "OFF") return;

    const msMap: Record<string, number> = {
      "5s": 5000,
      "15s": 15000,
      "30s": 30000,
      "60s": 60000,
    };

    const intervalMs = msMap[autoRefresh] || 15000;
    const timer = setInterval(() => {
      scanAllServers();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoRefresh, scanAllServers]);

  // KPIs y Estadísticas de la Flota
  const stats = useMemo(() => {
    const total = connections.length;
    let online = 0;
    let offline = 0;
    let totalLatency = 0;
    let countedOnline = 0;

    connections.forEach((conn) => {
      const res = results[conn.id];
      if (res) {
        if (res.isOnline) {
          online++;
          totalLatency += res.latencyMs;
          countedOnline++;
        } else {
          offline++;
        }
      }
    });

    const avgLatencyMs = countedOnline > 0 ? Math.round(totalLatency / countedOnline) : 0;

    return { total, online, offline, avgLatencyMs };
  }, [connections, results]);

  // Filtrado de servidores
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      const res = results[conn.id];

      // Filtro de estado
      if (filterStatus === "ONLINE" && (!res || !res.isOnline)) return false;
      if (filterStatus === "OFFLINE" && res && res.isOnline) return false;

      // Filtro de protocolo
      if (filterProtocol !== "ALL" && conn.protocol !== filterProtocol) return false;

      // Filtro de búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = conn.name.toLowerCase().includes(query);
        const matchesHost = conn.host.toLowerCase().includes(query);
        const matchesUser = conn.username.toLowerCase().includes(query);
        const matchesProtocol = conn.protocol.toLowerCase().includes(query);
        return matchesName || matchesHost || matchesUser || matchesProtocol;
      }

      return true;
    });
  }, [connections, results, filterStatus, filterProtocol, searchQuery]);

  const getProtocolIcon = (protocol: Protocol) => {
    switch (protocol) {
      case "SSH":
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      case "RDP":
        return <Monitor className="h-4 w-4 text-blue-400" />;
      case "SFTP":
        return <FolderTree className="h-4 w-4 text-cyan-400" />;
      case "WEB":
        return <Globe className="h-4 w-4 text-purple-400" />;
      case "VNC":
        return <Tv className="h-4 w-4 text-amber-400" />;
      default:
        return <Server className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-md text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Monitoreo en Vivo (NOC)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Fleet
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sondeo de latencia TCP y disponibilidad de servidores en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y selector de auto-refresco */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-md text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Auto-refresco:</span>
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.value as AutoRefreshInterval)}
              className="bg-transparent text-foreground font-semibold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="OFF">Manual</option>
              <option value="5s">Cada 5 seg</option>
              <option value="15s">Cada 15 seg</option>
              <option value="30s">Cada 30 seg</option>
              <option value="60s">Cada 1 min</option>
            </select>
          </div>

          <button
            onClick={scanAllServers}
            disabled={loading}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Escanear Ahora</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Servidores */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Servidores
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Infraestructura configurada</div>
          </div>
          <div className="p-2.5 bg-secondary rounded-md text-muted-foreground">
            <Server className="h-5 w-5" />
          </div>
        </div>

        {/* En Línea */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              En Línea (Online)
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
              {stats.online}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Puertos TCP respondiendo</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Fuera de Línea */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Fuera de Línea
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-2">
              {stats.offline}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sin respuesta o timeout</div>
          </div>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-600 dark:text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Latencia Promedio */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Latencia Media
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs} ms` : "--"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {stats.avgLatencyMs === 0
                ? "Sin datos"
                : stats.avgLatencyMs < 50
                ? "Conexión Excelente"
                : stats.avgLatencyMs < 150
                ? "Conexión Normal"
                : "Latencia Elevada"}
            </div>
          </div>
          <div className="p-2.5 bg-secondary rounded-md text-muted-foreground">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Chips de Estado y Protocolo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-secondary border border-border rounded-md text-xs font-medium overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded transition-colors shrink-0 ${
                filterStatus === "ALL"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({connections.length})
            </button>
            <button
              onClick={() => setFilterStatus("ONLINE")}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 ${
                filterStatus === "ONLINE"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>En Línea ({stats.online})</span>
            </button>
            <button
              onClick={() => setFilterStatus("OFFLINE")}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 ${
                filterStatus === "OFFLINE"
                  ? "bg-card text-rose-600 dark:text-rose-400 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Caídos ({stats.offline})</span>
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-secondary border border-border rounded-md text-xs font-medium overflow-x-auto scrollbar-none shrink-0">
            {(["ALL", "SSH", "RDP", "SFTP", "WEB", "VNC"] as const).map((proto) => (
              <button
                key={proto}
                onClick={() => setFilterProtocol(proto)}
                className={`px-2 py-1 rounded transition-colors text-[11px] shrink-0 ${
                  filterProtocol === proto
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {proto === "ALL" ? "Todos" : proto}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador de Servidor */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por nombre, host, usuario o protocolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/80 hover:bg-secondary border border-border rounded-md pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Servidor */}
      {filteredConnections.length === 0 ? (
        <div className="text-center py-16 bg-card/40 border border-border/60 rounded-2xl">
          <Server className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-foreground">No se encontraron servidores</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "ALL"
              ? "Prueba cambiando los filtros de búsqueda o el estado seleccionado."
              : "No tienes conexiones registradas todavía. Crea una para comenzar a monitorear."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((conn) => {
            const res = results[conn.id];
            const isIndividualLoading = !!singleLoading[conn.id];
            const isOnline = res?.isOnline;

            return (
              <div
                key={conn.id}
                className="bg-card border border-border hover:border-primary/40 rounded-lg p-4 flex flex-col justify-between transition-all hover:shadow-2xs group"
              >
                <div>
                  {/* Top card row: Protocol badge, Name & Ping Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-md bg-secondary border border-border shrink-0">
                        {getProtocolIcon(conn.protocol)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                          <span>{conn.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-secondary rounded text-muted-foreground font-mono">
                            {conn.protocol}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {conn.username}@{conn.host}:{conn.port}
                        </div>
                      </div>
                    </div>

                    {/* Single Ping Refresh Button */}
                    <button
                      onClick={() => scanSingleServer(conn)}
                      disabled={isIndividualLoading || loading}
                      className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                      title="Actualizar estado de este servidor"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isIndividualLoading ? "animate-spin text-primary" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Latency & Status Pill */}
                  <div className="mt-4 p-3 bg-secondary/60 border border-border rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {res ? (
                          isOnline ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">En Línea</span>
                            </>
                          ) : (
                            <>
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[140px]" title={res.error || "Fuera de línea"}>
                                {res.error ? "Inalcanzable" : "Fuera de Línea"}
                              </span>
                            </>
                          )
                        ) : (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
                            <span className="text-xs text-muted-foreground">Pendiente</span>
                          </>
                        )}
                      </div>

                      {/* Ping Ms badge */}
                      {res && isOnline && (
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
                          <Zap className="h-3 w-3 text-primary" />
                          <span>{res.latencyMs} ms</span>
                        </div>
                      )}
                    </div>

                    {/* Quality bar */}
                    {res && isOnline && (
                      <div className="mt-2.5 h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            res.latencyMs < 50
                              ? "bg-emerald-500 w-full"
                              : res.latencyMs < 120
                              ? "bg-blue-500 w-3/4"
                              : res.latencyMs < 250
                              ? "bg-amber-500 w-1/2"
                              : "bg-rose-500 w-1/4"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  {/* Diagnóstico profundo para SSH */}
                  {conn.protocol === "SSH" && onCheckHealth ? (
                    <button
                      onClick={() => onCheckHealth(conn)}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="Ver consumo de CPU, RAM y Disco del servidor"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Diagnóstico</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Botón de Conectar Directo */}
                  <button
                    onClick={() => onConnect(conn)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Conectar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      {lastUpdated && (
        <div className="text-center text-[11px] text-muted-foreground pt-2">
          Última actualización de la flota: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
