import { useState } from "react";
import { TerminalSettings, DEFAULT_TERMINAL_SETTINGS } from "@/types/theme";

const STORAGE_KEY = "zyntra_terminal_settings";

export function useTerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_TERMINAL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_TERMINAL_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<TerminalSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const resetDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSettings(DEFAULT_TERMINAL_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetDefaults,
  };
}
