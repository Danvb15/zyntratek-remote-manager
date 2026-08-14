import React from "react";
import { Shield, Database, Cpu } from "lucide-react";

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configuración y Diagnóstico del Sistema</h2>
        <p className="text-xs text-muted-foreground">
          Información general sobre los componentes de backend en Rust, almacén de credenciales y seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security & OS Keyring Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">OS Keyring Credential Vault</h3>
              <p className="text-xs text-muted-foreground">keyring-rs + zeroize</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Las contraseñas y claves privadas se custodian directamente en el gestor seguro del sistema operativo (Windows Credential Manager / Apple Keychain / Linux Secret Service). Se sobrescriben con ceros en RAM al usarse.
          </p>
          <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Almacén Nativo Activo
          </div>
        </div>

        {/* Database Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Persistencia SQLite Local</h3>
              <p className="text-xs text-muted-foreground">rusqlite (bundled)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Almacena únicamente metadatos de conexiones, jerarquía de carpetas y etiquetas. Sin secretos en texto plano ni columnas sensibles.
          </p>
          <div className="pt-2 text-xs font-mono text-blue-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            zyntratek.db (WAL Mode)
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" /> Stack del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Desktop Layer</span>
            <span className="font-semibold text-foreground">Tauri 2.0 (Rust)</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Frontend Framework</span>
            <span className="font-semibold text-foreground">React 18 + TS</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Estilos</span>
            <span className="font-semibold text-foreground">Tailwind CSS</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">IPC Handlers</span>
            <span className="font-semibold text-foreground">16 Handlers Activos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
