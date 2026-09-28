import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface NBModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const NBModal: React.FC<NBModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in">
      <div
        className="w-full max-w-xl bg-white border-[3px] border-black rounded-[4px] shadow-[8px_8px_0px_#0A0A0A] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#FFD93D] border-b-[3px] border-black">
          <h2 className="font-heading text-lg font-black uppercase tracking-wider text-black">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-black bg-white border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A] hover:bg-red-50 hover:text-red-600 active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
