import React from "react";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

export interface NBAlertProps {
  variant?: "danger" | "warning" | "safe" | "info" | "hazard";
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export const NBAlert: React.FC<NBAlertProps> = ({
  variant = "warning",
  title,
  children,
  className = "",
  onDismiss,
}) => {
  const styles = {
    danger: "bg-red-500 text-white border-nb-ink",
    warning: "bg-nb-yellow text-nb-ink border-nb-ink",
    safe: "bg-nb-green text-nb-ink border-nb-ink",
    info: "bg-nb-blue text-white border-nb-ink",
    hazard: "hazard-stripes text-white font-bold border-nb-ink",
  };

  const icons = {
    danger: <XCircle className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    safe: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    hazard: <AlertTriangle className="w-6 h-6 flex-shrink-0 text-yellow-300 animate-bounce" />,
  };

  return (
    <div
      className={`border-[3px] p-4 shadow-[4px_4px_0px_#0A0A0A] flex items-start gap-3.5 ${
        styles[variant]
      } ${className}`}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && (
          <h4 className="font-heading uppercase font-black text-sm tracking-wider mb-1">
            {title}
          </h4>
        )}
        <div className="font-mono text-xs font-semibold leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="font-mono font-black text-sm px-2 py-0.5 border-2 border-nb-ink bg-white text-nb-ink shadow-[2px_2px_0px_#0A0A0A] hover:bg-zinc-100"
        >
          ✕
        </button>
      )}
    </div>
  );
};
