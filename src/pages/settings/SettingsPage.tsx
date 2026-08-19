import React from "react";
import { Shield, Database, Cpu, Palette, Terminal, Type, RotateCcw } from "lucide-react";
import { useTerminalSettings } from "@/hooks/useTerminalSettings";
import { TERMINAL_THEMES } from "@/types/theme";

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDefaults } = useTerminalSettings();

  const activeTheme = TERMINAL_THEMES[settings.themeName]?.theme || TERMINAL_THEMES.zyntratek.theme;

  return (
    <div className="space-y-8 max-w-5xl select-none">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configuración y Personalización</h2>
        <p className="text-xs text-muted-foreground">
          Ajusta los temas de la terminal SSH, fuentes, cursores y revisa los componentes del sistema.
        </p>
      </div>

      {/* Terminal Customization Section */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Personalización de Terminal SSH</h3>
              <p className="text-xs text-muted-foreground">Colores, tipografías y comportamiento de xterm.js</p>
            </div>
          </div>

          <button
            onClick={resetDefaults}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border rounded-lg transition-colors flex items-center gap-1.5"
            title="Restablecer configuración predeterminada"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            Vista Previa en Vivo
          </label>
          <div
            className="p-4 rounded-xl border border-border font-mono transition-all overflow-hidden"
            style={{
              backgroundColor: activeTheme.background,
              color: activeTheme.foreground,
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily,
            }}
          >
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] ml-2 text-muted-foreground">zyntratek-session ~ ssh</span>
            </div>
            <div>
              <span style={{ color: activeTheme.green }}>root@production-server</span>:
              <span style={{ color: activeTheme.blue }}>/var/www/app</span># ls -la
            </div>
            <div style={{ color: activeTheme.brightBlack }}>total 64 drwxr-xr-x 8 root root 4096 Aug 18 16:30 .</div>
            <div>
              <span style={{ color: activeTheme.cyan }}>drwxr-xr-x</span> 2 root root 4096 config/
            </div>
            <div>
              <span style={{ color: activeTheme.green }}>-rwxr-xr-x</span> 1 root root 8192 server.bin
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span style={{ color: activeTheme.green }}>root@production-server</span>:
              <span style={{ color: activeTheme.blue }}>~</span>#
              <span
                className={`inline-block ${
                  settings.cursorBlink ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: settings.cursorStyle === "block" ? activeTheme.cursor : "transparent",
                  borderBottom: settings.cursorStyle === "underline" ? `2px solid ${activeTheme.cursor}` : "none",
                  borderLeft: settings.cursorStyle === "bar" ? `2px solid ${activeTheme.cursor}` : "none",
                  width: settings.cursorStyle === "block" ? "8px" : settings.cursorStyle === "bar" ? "2px" : "8px",
                  height: "14px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Theme Presets Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Esquema de Colores (Temas)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(TERMINAL_THEMES).map(([key, item]) => {
              const isSelected = settings.themeName === key;
              return (
                <button
                  key={key}
                  onClick={() => updateSettings({ themeName: key })}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                      : "border-border bg-secondary/30 hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{item.name}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  {/* Palette color dots */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-md" style={{ backgroundColor: item.theme.background }}>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.theme.red }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.theme.green }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.theme.yellow }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.theme.blue }} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.theme.cyan }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font, Size and Cursor controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Font Family */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-primary" />
              Familia Tipográfica
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="'JetBrains Mono', 'Fira Code', 'Consolas', monospace">JetBrains Mono / Consolas</option>
              <option value="'Fira Code', monospace">Fira Code (Ligatures)</option>
              <option value="'Cascadia Code', Consolas, monospace">Cascadia Code</option>
              <option value="Consolas, 'Courier New', monospace">Consolas</option>
              <option value="'Courier New', Courier, monospace">Courier New</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Tamaño de Fuente</span>
              <span className="font-mono text-foreground font-semibold">{settings.fontSize}px</span>
            </label>
            <input
              type="range"
              min={11}
              max={20}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary cursor-pointer mt-1"
            />
          </div>

          {/* Cursor Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estilo del Cursor</label>
            <select
              value={settings.cursorStyle}
              onChange={(e) => updateSettings({ cursorStyle: e.target.value as "block" | "underline" | "bar" })}
              className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="block">Bloque ( █ )</option>
              <option value="bar">Barra Vertical ( | )</option>
              <option value="underline">Subrayado ( _ )</option>
            </select>
          </div>
        </div>

        {/* Scrollback and Blink Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.cursorBlink}
              onChange={(e) => updateSettings({ cursorBlink: e.target.checked })}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-foreground block">Parpadeo del Cursor</span>
              <span className="text-[10px] text-muted-foreground block">Habilitar animación intermitente del cursor</span>
            </div>
          </label>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-foreground block">Buffer de Desplazamiento (Scrollback)</span>
              <span className="text-[10px] text-muted-foreground block">Líneas de historial retenidas en memoria</span>
            </div>
            <select
              value={settings.scrollback}
              onChange={(e) => updateSettings({ scrollback: Number(e.target.value) })}
              className="px-2.5 py-1 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={1000}>1,000 líneas</option>
              <option value={3000}>3,000 líneas</option>
              <option value={5000}>5,000 líneas</option>
              <option value={10000}>10,000 líneas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnostics and Architecture Info Cards */}
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
            Almacena únicamente metadatos de conexiones, jerarquía de carpetas, etiquetas y comandos rápidos. Sin secretos en texto plano ni columnas sensibles.
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Versión</span>
            <span className="font-semibold text-emerald-400 font-mono">v1.1.0</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Desktop Layer</span>
            <span className="font-semibold text-foreground">Tauri 2.0 (Rust)</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Frontend</span>
            <span className="font-semibold text-foreground">React 18 + TS</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Estilos</span>
            <span className="font-semibold text-foreground">Tailwind CSS</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Cifrado Backup</span>
            <span className="font-semibold text-foreground">AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
