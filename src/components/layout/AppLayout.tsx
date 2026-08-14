import React from "react";
import { Terminal, Shield, Folder, Star, Search, Plus } from "lucide-react";

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg tracking-tight">Zyntratek Manager</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navegación
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md bg-secondary text-secondary-foreground font-medium">
            <Terminal className="h-4 w-4" />
            Conexiones
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Star className="h-4 w-4" />
            Favoritos
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Folder className="h-4 w-4" />
            Carpetas
          </button>

          <div className="pt-4 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Seguridad
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Shield className="h-4 w-4" />
            Vault de Credenciales
          </button>
        </nav>

        <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
          Zyntratek Remote Manager v0.1.0 (Phase 1)
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar conexiones por nombre, host o tag..."
              className="w-full bg-secondary/50 border border-border rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            Nueva Conexión
          </button>
        </header>

        {/* Dashboard Placeholder for Phase 1 */}
        <section className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Cimientos de Fase 1 Inicializados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El entorno base de Zyntratek Remote Manager ha sido correctamente configurado con Tauri 2, Rust, React, TypeScript y Tailwind CSS.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Tauri v2 Listo
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                React + TS Ok
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                OS Keyring Vault Prepared
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
