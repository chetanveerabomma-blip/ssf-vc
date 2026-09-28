import React from "react";
import { clsx } from "clsx";

export interface NBToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
}

export const NBToggle: React.FC<NBToggleProps> = ({
  label,
  checked,
  onChange,
  description,
  className,
}) => {
  return (
    <label className={clsx("inline-flex items-center gap-3 cursor-pointer select-none", className)}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={clsx(
            "w-12 h-7 border-[3px] border-black rounded-[4px] transition-colors shadow-[2px_2px_0px_#0A0A0A]",
            checked ? "bg-[#6BCB77]" : "bg-[#E5E7EB]"
          )}
        />
        <div
          className={clsx(
            "absolute top-1 left-1 w-5 h-5 bg-white border-2 border-black rounded-[2px] transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
      <div>
        <span className="block font-heading text-xs font-black uppercase tracking-wider text-black">
          {label}
        </span>
        {description && <span className="block text-[11px] text-gray-700">{description}</span>}
      </div>
    </label>
  );
};
