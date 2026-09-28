"use client";

import React, { useRef } from "react";
import { SubjectCalculation } from "@/lib/engine";
import { NBTable } from "../nb/NBTable";
import { NBBadge } from "../nb/NBBadge";
import { Download, AlertOctagon } from "lucide-react";

export interface RiskLeaderboardProps {
  subjects: SubjectCalculation[];
}

export const RiskLeaderboard: React.FC<RiskLeaderboardProps> = ({ subjects }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute risk score = must_attend_75 / remaining (higher = more danger)
  // If must_attend_75 > remaining, risk score > 1.0 (IRREVERSIBLE)
  const ranked = [...subjects].map((s) => {
    const rawRatio = s.remaining_total > 0 ? s.must_attend_75 / s.remaining_total : s.must_attend_75 > 0 ? 999 : 0;
    return {
      ...s,
      riskRatio: rawRatio,
      riskScore: Math.min(100, Math.round(rawRatio * 100)),
    };
  }).sort((a, b) => b.riskRatio - a.riskRatio);

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `attendance-risk-leaderboard.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("PNG export error:", e);
    }
  };

  const getRiskChip = (ratio: number, status: string) => {
    if (status === "IRREVERSIBLE" || ratio > 1.0) {
      return (
        <span className="hazard-stripes text-white font-mono text-[10px] font-black px-2 py-0.5 border border-nb-ink">
          CRITICAL / IRREVERSIBLE
        </span>
      );
    }
    if (ratio >= 0.7) {
      return (
        <span className="bg-nb-red text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-nb-ink">
          HIGH RISK ({Math.round(ratio * 100)}%)
        </span>
      );
    }
    if (ratio >= 0.3) {
      return (
        <span className="bg-nb-yellow text-nb-ink font-mono text-[10px] font-bold px-2 py-0.5 border border-nb-ink">
          MODERATE ({Math.round(ratio * 100)}%)
        </span>
      );
    }
    return (
      <span className="bg-nb-green text-nb-ink font-mono text-[10px] font-bold px-2 py-0.5 border border-nb-ink">
        LOW RISK ({Math.round(ratio * 100)}%)
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] space-y-4"
      aria-label="Attendance Risk Leaderboard ranking subjects by detention vulnerability"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-zinc-200 gap-2">
        <div>
          <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-nb-red" />
            DETENTION RISK LEADERBOARD (RANKED BY VULNERABILITY)
          </h3>
          <p className="font-mono text-xs text-zinc-500">
            Formula: <code>Risk Score = (Must Attend 75% / Remaining Classes)</code>. Score &gt; 100% means irreversible detention.
          </p>
        </div>

        <button
          onClick={handleDownloadPNG}
          className="font-mono text-xs font-bold text-zinc-700 hover:text-nb-ink flex items-center gap-1 p-1 border border-nb-ink bg-zinc-100 shadow-[1px_1px_0px_#0A0A0A]"
          title="Download chart as PNG"
        >
          <Download className="w-3.5 h-3.5" /> PNG
        </button>
      </div>

      <NBTable
        headers={[
          "Rank",
          "Subject Code & Name",
          "Current %",
          "Remaining (R)",
          "Must Attend (75%)",
          "Bunk Margin",
          "Detention Risk Level",
        ]}
      >
        {ranked.map((s, idx) => (
          <tr
            key={s.code}
            className={`hover:bg-zinc-50 ${s.status === "IRREVERSIBLE" ? "bg-red-50" : ""}`}
          >
            <td className="px-3 py-3 font-mono font-black text-center border-r-[2px] border-nb-ink">
              #{idx + 1}
            </td>
            <td className="px-3 py-3 border-r-[2px] border-nb-ink">
              <div className="font-bold text-xs">{s.code}</div>
              <div className="text-[11px] text-zinc-600 truncate max-w-xs">{s.name}</div>
            </td>
            <td className="px-3 py-3 font-mono font-bold text-center border-r-[2px] border-nb-ink">
              <span className={s.current_percentage < 75 ? "text-nb-red font-black" : "text-nb-ink"}>
                {s.current_percentage}%
              </span>
            </td>
            <td className="px-3 py-3 font-mono font-bold text-center border-r-[2px] border-nb-ink">
              {s.remaining_total}
            </td>
            <td className="px-3 py-3 font-mono font-black text-center border-r-[2px] border-nb-ink text-nb-red">
              {s.must_attend_75}
            </td>
            <td className="px-3 py-3 font-mono font-bold text-center border-r-[2px] border-nb-ink text-green-700">
              {s.can_bunk_75}
            </td>
            <td className="px-3 py-3 text-center">
              {getRiskChip(s.riskRatio, s.status)}
            </td>
          </tr>
        ))}
      </NBTable>
    </div>
  );
};
