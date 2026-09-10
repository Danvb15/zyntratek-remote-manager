import { useState, useEffect } from "react";
import { AppThemeId, APP_THEMES, AppThemeMeta } from "@/types/appTheme";

const STORAGE_KEY = "zyntratek_app_theme";
const DEFAULT_THEME: AppThemeId = "cyberpunk-obsidian";

export function useAppTheme() {
  const [themeId, setThemeIdState] = useState<AppThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppThemeId | null;
    return saved && APP_THEMES[saved] ? saved : DEFAULT_THEME;
  });

  const setThemeId = (newTheme: AppThemeId) => {
    if (!APP_THEMES[newTheme]) return;
    setThemeIdState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove any previous theme-* classes
    Object.values(APP_THEMES).forEach((t) => {
      root.classList.remove(t.styleClass);
    });

    const activeMeta = APP_THEMES[themeId] || APP_THEMES[DEFAULT_THEME];
    root.classList.add(activeMeta.styleClass);
  }, [themeId]);

  return {
    themeId,
    setThemeId,
    currentTheme: APP_THEMES[themeId] || APP_THEMES[DEFAULT_THEME],
    allThemes: Object.values(APP_THEMES) as AppThemeMeta[],
  };
}
