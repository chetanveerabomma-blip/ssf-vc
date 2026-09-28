import React from "react";
import { clsx } from "clsx";

export interface NBSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}

export const NBSelect: React.FC<NBSelectProps> = ({
  label,
  options,
  className,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1.5 font-heading text-xs font-black uppercase tracking-wider text-black"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          "w-full px-3.5 py-2.5 bg-white text-black font-mono text-sm",
          "border-[3px] border-black rounded-[4px]",
          "shadow-[3px_3px_0px_#0A0A0A]",
          "focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2",
          "cursor-pointer",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
