"use client";

import React, { useRef } from "react";
import { OverallCalculation } from "@/lib/engine";
import { NBSticker } from "../nb/NBSticker";
import { Download } from "lucide-react";

export interface HealthGaugeProps {
  overall: OverallCalculation;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ overall }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, overall.current_percentage));

  // Map 0 - 100% to angle in degrees from -180 to 0 (semicircle)
  // angle = -180 + (pct / 100) * 180
  const needleAngle = -180 + (pct / 100) * 180;

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `attendance-health-gauge-${new Date().toISOString().split("T")[0]}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("PNG export error:", e);
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] flex flex-col items-center justify-between relative"
      aria-label={`Overall Attendance Health Gauge: ${pct}%`}
    >
      <div className="w-full flex justify-between items-center pb-2 border-b-[2px] border-zinc-200 mb-2">
        <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
          OVERALL ATTENDANCE HEALTH GAUGE
        </h3>
        <button
          onClick={handleDownloadPNG}
          className="font-mono text-xs font-bold text-zinc-700 hover:text-nb-ink flex items-center gap-1 p-1 border border-nb-ink bg-zinc-100 shadow-[1px_1px_0px_#0A0A0A]"
          title="Download chart as PNG"
        >
          <Download className="w-3.5 h-3.5" /> PNG
        </button>
      </div>

      {/* SVG Semicircle Gauge */}
      <div className="relative w-64 h-36 flex items-center justify-center my-2">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
          {/* Background Arc: Red zone (0% to 75%) -> angles -180 to -45 */}
          <path
            d="M 20 100 A 80 80 0 0 1 143.4 34.1"
            fill="none"
            stroke="#FF3B30"
            strokeWidth="20"
            strokeLinecap="square"
          />
          {/* Black separator border between red and yellow */}
          <path
            d="M 20 100 A 80 80 0 0 1 143.4 34.1"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2"
          />

          {/* Yellow zone (75% to 90%) -> angles -45 to -18 */}
          <path
            d="M 143.4 34.1 A 80 80 0 0 1 176.1 75.3"
            fill="none"
            stroke="#FFD93D"
            strokeWidth="20"
            strokeLinecap="square"
          />

          {/* Green zone (90% to 100%) -> angles -18 to 0 */}
          <path
            d="M 176.1 75.3 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#6BCB77"
            strokeWidth="20"
            strokeLinecap="square"
          />

          {/* Outer/Inner Thick Borders */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="3"
          />
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="3"
          />

          {/* Pivot Circle */}
          <circle cx="100" cy="100" r="10" fill="#0A0A0A" />

          {/* Gauge Needle with transition */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 300ms ease-out",
            }}
          >
            <polygon points="98,100 102,100 100,22" fill="#0A0A0A" />
            <polygon points="99,100 101,100 100,24" fill="#FFD93D" />
          </g>
        </svg>

        {/* 75% and 90% threshold badges */}
        <span className="absolute left-6 bottom-0 font-mono text-[10px] font-bold text-zinc-500">0%</span>
        <span className="absolute right-4 bottom-0 font-mono text-[10px] font-bold text-zinc-500">100%</span>
      </div>

      {/* Big Mono Number & Status */}
      <div className="text-center space-y-1">
        <div className="font-mono text-4xl font-black text-nb-ink tracking-tight">
          {pct}%
        </div>
        <div className="font-mono text-xs text-zinc-600 font-bold">
          {overall.total_attended} attended / {overall.total_held} held so far
        </div>
        <div className="pt-1">
          {overall.status === "IRREVERSIBLE" ? (
            <NBSticker text="IRREVERSIBLE" color="red" rotation="-2deg" />
          ) : overall.status === "DANGER" ? (
            <NBSticker text="DANGER" color="yellow" rotation="-2deg" />
          ) : overall.status === "SAFE_75" ? (
            <NBSticker text="ELIGIBLE" color="green" rotation="2deg" />
          ) : (
            <NBSticker text="SAFE (90%+)" color="green" rotation="2deg" />
          )}
        </div>
      </div>

      {/* Screen-reader accessible table fallback */}
      <table className="sr-only">
        <caption>Overall Attendance Standing</caption>
        <tbody>
          <tr><th>Current Percentage</th><td>{pct}%</td></tr>
          <tr><th>Status</th><td>{overall.status}</td></tr>
          <tr><th>Held</th><td>{overall.total_held}</td></tr>
          <tr><th>Attended</th><td>{overall.total_attended}</td></tr>
        </tbody>
      </table>
    </div>
  );
};
