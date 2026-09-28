import React, { forwardRef } from "react";

export interface NBSelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface NBSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: NBSelectOption[];
  children?: React.ReactNode;
}

export const NBSelect = forwardRef<HTMLSelectElement, NBSelectProps>(
  ({ label, error, options, children, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block font-heading uppercase text-xs font-black tracking-wider text-nb-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-3.5 py-2.5 bg-white text-nb-ink font-mono text-sm border-[3px] border-nb-ink shadow-[4px_4px_0px_#0A0A0A] focus:outline-none cursor-pointer ${
              error ? "bg-red-50 border-nb-red" : ""
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
        </div>
        {error && (
          <div className="bg-nb-red text-white font-mono text-xs font-bold px-2.5 py-1 border-[2px] border-nb-ink shadow-[2px_2px_0px_#0A0A0A] inline-block">
            ⚠ {error}
          </div>
        )}
      </div>
    );
  }
);

NBSelect.displayName = "NBSelect";
