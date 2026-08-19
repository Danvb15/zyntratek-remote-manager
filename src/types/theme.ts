export interface ITheme {
  foreground?: string;
  background?: string;
  cursor?: string;
  cursorAccent?: string;
  selectionBackground?: string;
  selectionForeground?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

export interface TerminalSettings {
  themeName: string;
  fontSize: number;
  fontFamily: string;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollback: number;
}

export const TERMINAL_THEMES: Record<string, { name: string; theme: ITheme }> = {
  zyntratek: {
    name: "Zyntratek Cyber (Por defecto)",
    theme: {
      background: "#070B14",
      foreground: "#E2E8F0",
      cursor: "#00F0FF",
      cursorAccent: "#070B14",
      selectionBackground: "rgba(0, 240, 255, 0.25)",
      black: "#0F172A",
      red: "#F43F5E",
      green: "#10B981",
      yellow: "#F59E0B",
      blue: "#3B82F6",
      magenta: "#8B5CF6",
      cyan: "#06B6D4",
      white: "#F8FAFC",
      brightBlack: "#475569",
      brightRed: "#FB7185",
      brightGreen: "#34D399",
      brightYellow: "#FBBF24",
      brightBlue: "#60A5FA",
      brightMagenta: "#A78BFA",
      brightCyan: "#22D3EE",
      brightWhite: "#FFFFFF",
    },
  },
  dracula: {
    name: "Dracula",
    theme: {
      background: "#282a36",
      foreground: "#f8f8f2",
      cursor: "#f8f8f2",
      cursorAccent: "#282a36",
      selectionBackground: "rgba(68, 71, 90, 0.5)",
      black: "#21222c",
      red: "#ff5555",
      green: "#50fa7b",
      yellow: "#f1fa8c",
      blue: "#bd93f9",
      magenta: "#ff79c6",
      cyan: "#8be9fd",
      white: "#f8f8f2",
      brightBlack: "#6272a4",
      brightRed: "#ff6e6e",
      brightGreen: "#69ff94",
      brightYellow: "#ffffa5",
      brightBlue: "#d6acff",
      brightMagenta: "#ff92df",
      brightCyan: "#a4ffff",
      brightWhite: "#ffffff",
    },
  },
  oneDark: {
    name: "One Dark",
    theme: {
      background: "#282c34",
      foreground: "#abb2bf",
      cursor: "#528bff",
      cursorAccent: "#282c34",
      selectionBackground: "rgba(62, 68, 81, 0.6)",
      black: "#1e2127",
      red: "#e06c75",
      green: "#98c379",
      yellow: "#d19a66",
      blue: "#61afef",
      magenta: "#c678dd",
      cyan: "#56b6c2",
      white: "#abb2bf",
      brightBlack: "#5c6370",
      brightRed: "#e06c75",
      brightGreen: "#98c379",
      brightYellow: "#d19a66",
      brightBlue: "#61afef",
      brightMagenta: "#c678dd",
      brightCyan: "#56b6c2",
      brightWhite: "#ffffff",
    },
  },
  nord: {
    name: "Nord Frost",
    theme: {
      background: "#2e3440",
      foreground: "#d8dee9",
      cursor: "#d8dee9",
      cursorAccent: "#2e3440",
      selectionBackground: "rgba(67, 76, 94, 0.6)",
      black: "#3b4252",
      red: "#bf616a",
      green: "#a3be8c",
      yellow: "#ebcb8b",
      blue: "#81a1c1",
      magenta: "#b48ead",
      cyan: "#88c0d0",
      white: "#e5e9f0",
      brightBlack: "#4c566a",
      brightRed: "#bf616a",
      brightGreen: "#a3be8c",
      brightYellow: "#ebcb8b",
      brightBlue: "#81a1c1",
      brightMagenta: "#b48ead",
      brightCyan: "#8fbcbb",
      brightWhite: "#eceff4",
    },
  },
  monokai: {
    name: "Monokai Pro",
    theme: {
      background: "#272822",
      foreground: "#f8f8f2",
      cursor: "#f8f8f0",
      cursorAccent: "#272822",
      selectionBackground: "rgba(73, 72, 62, 0.6)",
      black: "#272822",
      red: "#f92672",
      green: "#a6e22e",
      yellow: "#f4bf75",
      blue: "#66d9ef",
      magenta: "#ae81ff",
      cyan: "#a1efe4",
      white: "#f8f8f2",
      brightBlack: "#75715e",
      brightRed: "#f92672",
      brightGreen: "#a6e22e",
      brightYellow: "#f4bf75",
      brightBlue: "#66d9ef",
      brightMagenta: "#ae81ff",
      brightCyan: "#a1efe4",
      brightWhite: "#f9f8f5",
    },
  },
  gruvbox: {
    name: "Gruvbox Dark",
    theme: {
      background: "#282828",
      foreground: "#ebdbb2",
      cursor: "#ebdbb2",
      cursorAccent: "#282828",
      selectionBackground: "rgba(80, 73, 69, 0.6)",
      black: "#282828",
      red: "#cc241d",
      green: "#98971a",
      yellow: "#d79921",
      blue: "#458588",
      magenta: "#b16286",
      cyan: "#689d6a",
      white: "#a89984",
      brightBlack: "#928374",
      brightRed: "#fb4934",
      brightGreen: "#b8bb26",
      brightYellow: "#fabd2f",
      brightBlue: "#83a598",
      brightMagenta: "#d3869b",
      brightCyan: "#8ec07c",
      brightWhite: "#ebdbb2",
    },
  },
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  themeName: "zyntratek",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  cursorStyle: "block",
  cursorBlink: true,
  scrollback: 5000,
};
