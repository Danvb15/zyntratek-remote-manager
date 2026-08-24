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
    { label: "CTRL+C", code: "\x03", highlight: true, color: "text-rose-400" },
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
    <div className="bg-[#0D1527] border-t border-border/80 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto select-none scrollbar-none z-30 shrink-0 shadow-inner">
      {/* Quick Snippets */}
      {onOpenSnippets && (
        <button
          onClick={onOpenSnippets}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold active:scale-95 transition-transform shrink-0"
          title="Snippets Rápidos"
        >
          <Sliders className="h-3 w-3" />
          <span>Snippets</span>
        </button>
      )}

      {/* Paste from Clipboard */}
      <button
        onClick={handlePasteClipboard}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80 border border-border text-foreground text-xs font-medium active:scale-95 transition-transform shrink-0"
        title="Pegar del portapapeles"
      >
        <ClipboardPaste className="h-3.5 w-3.5 text-cyan-400" />
      </button>

      {/* Arrow Keys */}
      <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-border/50 shrink-0">
        <button
          onClick={() => onSendKey("\x1b[A")}
          className="p-1 rounded bg-secondary/60 active:bg-primary active:text-white text-muted-foreground transition-colors"
          title="Arriba"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[B")}
          className="p-1 rounded bg-secondary/60 active:bg-primary active:text-white text-muted-foreground transition-colors"
          title="Abajo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[D")}
          className="p-1 rounded bg-secondary/60 active:bg-primary active:text-white text-muted-foreground transition-colors"
          title="Izquierda"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onSendKey("\x1b[C")}
          className="p-1 rounded bg-secondary/60 active:bg-primary active:text-white text-muted-foreground transition-colors"
          title="Derecha"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Key Shortcut Buttons */}
      {keyButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => onSendKey(btn.code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold active:scale-90 transition-all shrink-0 ${
            btn.highlight
              ? "bg-secondary text-foreground border border-border shadow-2xs hover:border-primary/50"
              : "bg-background/60 text-muted-foreground border border-border/40 hover:text-foreground"
          } ${btn.color || ""}`}
        >
          {btn.label}
        </button>
      ))}

      {/* Zoom In / Out */}
      {onZoomIn && (
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg bg-secondary/60 text-muted-foreground active:text-primary shrink-0"
          title="Aumentar fuente"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      )}
      {onZoomOut && (
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg bg-secondary/60 text-muted-foreground active:text-primary shrink-0"
          title="Disminuir fuente"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
