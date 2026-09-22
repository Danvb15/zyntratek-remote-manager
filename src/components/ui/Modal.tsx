import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Bottom Sheet Pull Indicator */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2 mb-1 block sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-base sm:text-lg tracking-tight text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-secondary transition-colors"
            title="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
