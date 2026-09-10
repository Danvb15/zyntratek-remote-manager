import React from "react";
import { Modal } from "@/components/ui/Modal";
import { AppThemeId, AppThemeMeta } from "@/types/appTheme";
import { Check, Sun, Moon, Building } from "lucide-react";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
  allThemes: AppThemeMeta[];
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
  allThemes,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tema y Apariencia">
      <div className="space-y-4 select-none">
        <p className="text-xs text-muted-foreground">
          Selecciona el tema visual para la aplicación. Los cambios se aplican de forma inmediata y se conservan automáticamente.
        </p>

        <div className="space-y-2.5 pt-1">
          {allThemes.map((t) => {
            const isSelected = t.id === activeThemeId;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTheme(t.id)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-secondary/60 hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Theme Icon */}
                  <div
                    className="h-10 w-10 rounded-md border flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: t.preview.bg,
                      borderColor: t.preview.border,
                      color: t.preview.primary,
                    }}
                  >
                    {t.id === "win11-light" ? (
                      <Sun className="h-5 w-5 text-amber-500" />
                    ) : t.id === "win11-dark" ? (
                      <Moon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Building className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="truncate">{t.name}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {t.badge}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t.description}
                    </div>
                  </div>
                </div>

                {/* Radio selection indicator */}
                <div className="shrink-0">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-2xs"
          >
            Listo
          </button>
        </div>
      </div>
    </Modal>
  );
};
