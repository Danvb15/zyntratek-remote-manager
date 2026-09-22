import React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Sliders,
} from "lucide-react";

interface MobileTerminalKeypadProps {
  onSendKey: (key: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onOpenSnippets?: () => void;
}

export const MobileTerminalKeypad: React.FC<MobileTerminalKeypadProps> = ({
  onSendKey,
  onZoomIn,
  onZoomOut,
  onOpenSnippets,
}) => {
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onSendKey(text);
        }
      }
    } catch {
      // Ignored if permission denied
    }
  };

  const keyButtons = [
    { label: "ESC", code: "\x1b", highlight: true },
    { label: "TAB", code: "\t", highlight: true },
    { label: "CTRL+C", code: "\x03", highlight: true, color: "text-rose-500 dark:text-rose-400" },
    { label: "CTRL+Z", code: "\x1a" },
    { label: "CTRL+D", code: "\x04" },
    { label: "CTRL+L", code: "\x0c" },
    { label: "/", code: "/" },
    { label: "~", code: "~" },
    { label: "|", code: "|" },
    { label: "-", code: "-" },
    { label: "_", code: "_" },
    { label: ":", code: ":" },
    { label: "$", code: "$" },
    { label: "@", code: "@" },
  ];

  return (
    <div className="bg-card/95 backdrop-blur-md border-t border-border px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto select-none scrollbar-none z-30 shrink-0 shadow-lg">
      {/* Quick Snippets */}
      {onOpenSnippets && (
        <button
          onClick={onOpenSnippets}
          className="flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold active:scale-95 transition-transform shrink-0"
          title="Snippets Rápidos"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Snippets</span>
        </button>
      )}

      {/* Paste from Clipboard */}
      <button
        onClick={handlePasteClipboard}
        className="flex items-center justify-center min-w-[34px] min-h-[34px] px-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium active:scale-95 transition-transform shrink-0"
        title="Pegar del portapapeles"
      >
        <ClipboardPaste className="h-4 w-4 text-primary" />
      </button>

      {/* Arrow Keys (Cruceta táctil ergonómica) */}
      <div className="flex items-center gap-1 bg-secondary/70 p-0.5 rounded-lg border border-border shrink-0">
        <button
          onClick={() => onSendKey("\x1b[A")}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md bg-card active:bg-primary active:text-primary-foreground text-foreground hover:bg-secondary transition-colors"
          title="Arriba"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[B")}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md bg-card active:bg-primary active:text-primary-foreground text-foreground hover:bg-secondary transition-colors"
          title="Abajo"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[D")}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md bg-card active:bg-primary active:text-primary-foreground text-foreground hover:bg-secondary transition-colors"
          title="Izquierda"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[C")}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md bg-card active:bg-primary active:text-primary-foreground text-foreground hover:bg-secondary transition-colors"
          title="Derecha"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Key Shortcut Buttons */}
      {keyButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => onSendKey(btn.code)}
          className={`min-h-[34px] px-3 py-1 flex items-center justify-center rounded-lg text-xs font-mono font-bold active:scale-90 transition-all shrink-0 ${
            btn.highlight
              ? "bg-secondary text-foreground border border-border shadow-2xs hover:border-primary/50"
              : "bg-card text-muted-foreground border border-border/60 hover:text-foreground"
          } ${btn.color || ""}`}
        >
          {btn.label}
        </button>
      ))}

      {/* Zoom In / Out */}
      {onZoomIn && (
        <button
          onClick={onZoomIn}
          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-secondary text-muted-foreground active:text-primary shrink-0"
          title="Aumentar fuente"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      )}
      {onZoomOut && (
        <button
          onClick={onZoomOut}
          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-secondary text-muted-foreground active:text-primary shrink-0"
          title="Disminuir fuente"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
