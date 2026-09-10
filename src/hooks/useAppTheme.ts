import { useState, useEffect, useCallback } from "react";
import { AppThemeId, APP_THEMES, AppThemeMeta, DEFAULT_APP_THEME_ID } from "@/types/appTheme";

const STORAGE_KEY = "zyntratek_app_theme";

export function useAppTheme() {
  const [themeId, setThemeIdState] = useState<AppThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppThemeId | null;
    return saved && APP_THEMES[saved] ? saved : DEFAULT_APP_THEME_ID;
  });

  const setThemeId = useCallback((newTheme: AppThemeId) => {
    if (!APP_THEMES[newTheme]) return;
    setThemeIdState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleLightDark = useCallback(() => {
    setThemeIdState((prev) => {
      const next: AppThemeId = prev === "win11-dark" ? "win11-light" : "win11-dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove any previous theme-* classes
    Object.values(APP_THEMES).forEach((t) => {
      root.classList.remove(t.styleClass);
    });
    // Remove legacy classes if any
    root.classList.remove("theme-obsidian", "theme-glass", "theme-titanium", "theme-oled");

    const activeMeta = APP_THEMES[themeId] || APP_THEMES[DEFAULT_APP_THEME_ID];
    root.classList.add(activeMeta.styleClass);

    // Also set standard color-scheme meta
    if (activeMeta.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeId]);

  const currentTheme = APP_THEMES[themeId] || APP_THEMES[DEFAULT_APP_THEME_ID];

  return {
    themeId,
    setThemeId,
    toggleLightDark,
    isDark: currentTheme.isDark,
    currentTheme,
    allThemes: Object.values(APP_THEMES) as AppThemeMeta[],
  };
}
