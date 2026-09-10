export type AppThemeId =
  | "cyberpunk-obsidian"
  | "macos-glass"
  | "vercel-titanium"
  | "oled-pure-black";

export interface AppThemeMeta {
  id: AppThemeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  preview: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    border: string;
  };
  styleClass: string;
}

export const APP_THEMES: Record<AppThemeId, AppThemeMeta> = {
  "cyberpunk-obsidian": {
    id: "cyberpunk-obsidian",
    name: "Cyberpunk Obsidian",
    tagline: "Estilo Warp & Linear",
    description: "Fondo negro carbón ultra profundo con halos luminosos cian y verde esmeralda.",
    badge: "Recomendado",
    preview: {
      bg: "#08090E",
      card: "#0F111A",
      primary: "#06B6D4",
      accent: "#10B981",
      border: "rgba(6, 182, 212, 0.25)",
    },
    styleClass: "theme-obsidian",
  },
  "macos-glass": {
    id: "macos-glass",
    name: "macOS Frosted Glass",
    tagline: "Estilo Apple & Raycast",
    description: "Superficies translúcidas con desenfoque de cristal líquido, zafiro suave y bordes especulares.",
    badge: "Elegante",
    preview: {
      bg: "#0C1222",
      card: "rgba(22, 33, 58, 0.7)",
      primary: "#3B82F6",
      accent: "#60A5FA",
      border: "rgba(255, 255, 255, 0.15)",
    },
    styleClass: "theme-glass",
  },
  "vercel-titanium": {
    id: "vercel-titanium",
    name: "Vercel Titanium",
    tagline: "Minimalismo Silicon Valley",
    description: "Escala monocromática de titanio oscuro con tipografía blanca nítida y contraste puro.",
    badge: "Minimal",
    preview: {
      bg: "#000000",
      card: "#121212",
      primary: "#FFFFFF",
      accent: "#10B981",
      border: "#262626",
    },
    styleClass: "theme-titanium",
  },
  "oled-pure-black": {
    id: "oled-pure-black",
    name: "OLED Negro Puro",
    tagline: "Ahorro Máximo de Batería",
    description: "Negro absoluto #000000 para pantallas OLED/AMOLED con azul cielo de alto contraste.",
    badge: "OLED Ahorro",
    preview: {
      bg: "#000000",
      card: "#080808",
      primary: "#38BDF8",
      accent: "#06B6D4",
      border: "#1F1F1F",
    },
    styleClass: "theme-oled",
  },
};
