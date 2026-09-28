import React from "react";

export interface NBProgressBarProps {
  value: number; // 0 to 100
  maxPossible?: number;
  showMarkers?: boolean;
  className?: string;
}

export const NBProgressBar: React.FC<NBProgressBarProps> = ({
  value,
  maxPossible,
  showMarkers = true,
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Determine bar color
  let barColorClass = "bg-nb-red";
  if (clampedValue >= 90) {
    barColorClass = "bg-nb-green";
  } else if (clampedValue >= 75) {
    barColorClass = "bg-nb-yellow";
  }

  const isIrreversible = maxPossible !== undefined && maxPossible < 75;

  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="relative w-full h-8 bg-zinc-200 border-[3px] border-nb-ink shadow-[3px_3px_0px_#0A0A0A] overflow-hidden">
        {/* Progress fill */}
        <div
          className={`h-full transition-all duration-300 border-r-[3px] border-nb-ink ${
            isIrreversible ? "hazard-stripes" : barColorClass
          }`}
          style={{ width: `${clampedValue}%` }}
        />

        {/* 75% Marker Line */}
        {showMarkers && (
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-nb-ink z-10"
            style={{ left: "75%" }}
          >
            <div className="absolute -top-1 -left-4 bg-nb-red text-white text-[9px] font-mono font-bold px-1 border border-nb-ink shadow-[1px_1px_0px_#0A0A0A]">
              75%
            </div>
          </div>
        )}

        {/* 90% Marker Line */}
        {showMarkers && (
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-nb-ink z-10"
            style={{ left: "90%" }}
          >
            <div className="absolute -top-1 -left-4 bg-nb-green text-nb-ink text-[9px] font-mono font-bold px-1 border border-nb-ink shadow-[1px_1px_0px_#0A0A0A]">
              90%
            </div>
          </div>
        )}
      </div>

      {showMarkers && (
        <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-600 px-0.5">
          <span>0%</span>
          <span className="text-nb-red">⚠ 75% Detention Line</span>
          <span className="text-green-700">★ 90% Target</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
