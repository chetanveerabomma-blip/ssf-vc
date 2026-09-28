import React from "react";
import { clsx } from "clsx";

export interface NBInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const NBInput = React.forwardRef<HTMLInputElement, NBInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 font-heading text-xs font-black uppercase tracking-wider text-black"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full px-3.5 py-2.5 bg-white text-black font-mono text-sm",
            "border-[3px] border-black rounded-[4px]",
            "shadow-[3px_3px_0px_#0A0A0A]",
            "placeholder:text-gray-500",
            "focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2",
            error && "border-[#FF3B30] bg-red-50",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs font-bold text-[#FF3B30] font-mono">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-gray-600 font-mono">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

NBInput.displayName = "NBInput";
