import React from "react";
import { clsx } from "clsx";

export interface NBSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  displayValue?: string | number;
  className?: string;
}

export const NBSlider: React.FC<NBSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  className,
}) => {
  return (
    <div className={clsx("w-full", className)}>
      <div className="flex justify-between items-center mb-1.5">
        <label className="font-heading text-xs font-black uppercase tracking-wider text-black">
          {label}
        </label>
        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#FFD93D] border-2 border-black rounded-[2px] shadow-[1px_1px_0px_#0A0A0A]">
          {displayValue !== undefined ? displayValue : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 bg-white border-2 border-black rounded-lg appearance-none cursor-pointer accent-[#FF6B9D] focus:outline-none"
      />
    </div>
  );
};
