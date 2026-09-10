export type AppThemeId =
  | "win11-light"
  | "win11-dark"
  | "win11-slate";

export interface AppThemeMeta {
  id: AppThemeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  isDark: boolean;
  preview: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    border: string;
    text: string;
  };
  styleClass: string;
}

export const APP_THEMES: Record<AppThemeId, AppThemeMeta> = {
  "win11-light": {
    id: "win11-light",
    name: "Windows 11 Claro Oficial",
    tagline: "Mica Light / Fluent Oficial",
    description: "Fondo gris perla suave, tarjetas blanco puro con borde micro-fino y azul oficial de Windows 11.",
    badge: "Predeterminado",
    isDark: false,
    preview: {
      bg: "#F3F3F3",
      card: "#FFFFFF",
      primary: "#0067C0",
      accent: "#0078D4",
      border: "#E5E5E5",
      text: "#1C1C1C",
    },
    styleClass: "theme-win11-light",
  },
  "win11-dark": {
    id: "win11-dark",
    name: "Windows 11 Oscuro",
    tagline: "Mica Dark / Windows Terminal",
    description: "Gris carbón neutro de Windows Terminal, sin luces de neón, con tipografía clara de alto contraste.",
    badge: "Sobrio",
    isDark: true,
    preview: {
      bg: "#202020",
      card: "#2C2C2C",
      primary: "#60CDFF",
      accent: "#0078D4",
      border: "#3D3D3D",
      text: "#FFFFFF",
    },
    styleClass: "theme-win11-dark",
  },
  "win11-slate": {
    id: "win11-slate",
    name: "Corporativo Platino",
    tagline: "Slate Light Profesional",
    description: "Gris pizarra azulado tenue con tarjetas blanco nítido y acento azul marino para sysadmins.",
    badge: "Oficina",
    isDark: false,
    preview: {
      bg: "#F1F5F9",
      card: "#FFFFFF",
      primary: "#1E40AF",
      accent: "#2563EB",
      border: "#CBD5E1",
      text: "#0F172A",
    },
    styleClass: "theme-win11-slate",
  },
};

export const DEFAULT_APP_THEME_ID: AppThemeId = "win11-light";
