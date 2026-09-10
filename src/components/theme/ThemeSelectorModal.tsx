import React from "react";
import { Modal } from "@/components/ui/Modal";
import { AppThemeId, AppThemeMeta } from "@/types/appTheme";
import { Check, Sparkles } from "lucide-react";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Personalizar Tema Visual">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            El tema seleccionado se aplica de forma instantánea a toda la aplicación y se guarda automáticamente.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {allThemes.map((t) => {
            const isSelected = t.id === activeThemeId;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTheme(t.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between group ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary"
                    : "border-border bg-secondary/40 hover:bg-secondary/70 hover:border-border"
                }`}
              >
                <div>
                  {/* Top row: Name & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span>{t.name}</span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.tagline}</div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold shrink-0 ${
                        isSelected
                          ? "bg-primary/20 text-primary border-primary/40"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {t.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Color Swatches Palette Preview */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shadow-2xs"
                      style={{ backgroundColor: t.preview.bg }}
                      title="Fondo"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shadow-2xs"
                      style={{ backgroundColor: t.preview.card }}
                      title="Tarjeta"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shadow-2xs"
                      style={{ backgroundColor: t.preview.primary }}
                      title="Color Primario"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shadow-2xs"
                      style={{ backgroundColor: t.preview.accent }}
                      title="Acento"
                    />
                  </div>

                  <span className="text-[11px] font-medium text-foreground opacity-70 group-hover:opacity-100 group-hover:text-primary transition-colors">
                    {isSelected ? "Activo" : "Seleccionar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
          >
            Listo
          </button>
        </div>
      </div>
    </Modal>
  );
};
