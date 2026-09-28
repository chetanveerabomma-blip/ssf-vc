import React from "react";
import { OverallCalculation } from "@/lib/engine";
import { NBBadge } from "../nb/NBBadge";
import { Calendar, CheckCircle2, ShieldAlert, XCircle, ArrowUpRight } from "lucide-react";

export interface KPIStripProps {
  overall: OverallCalculation;
  daysLeft: number;
  workingDaysLeft: number;
}

export const KPIStrip: React.FC<KPIStripProps> = ({
  overall,
  daysLeft,
  workingDaysLeft,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* 1. Overall Attendance */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A] col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-zinc-600 mb-1">
          <span className="font-heading uppercase text-xs font-black">Overall %</span>
          <ArrowUpRight className="w-4 h-4 text-nb-ink" />
        </div>
        <div className="font-mono text-3xl font-black text-nb-ink">
          {overall.current_percentage}%
        </div>
        <div className="mt-2">
          <NBBadge status={overall.status} size="sm" />
        </div>
      </div>

      {/* 2. Days Left */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between text-zinc-600 mb-1">
          <span className="font-heading uppercase text-xs font-black">Days Remaining</span>
          <Calendar className="w-4 h-4 text-nb-ink" />
        </div>
        <div className="font-mono text-3xl font-black text-nb-ink">{daysLeft}</div>
        <div className="font-mono text-[11px] font-bold text-zinc-600 mt-1">
          ({workingDaysLeft} working days)
        </div>
      </div>

      {/* 3. Total Classes Remaining */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between text-zinc-600 mb-1">
          <span className="font-heading uppercase text-xs font-black">Scheduled Left</span>
          <span className="font-mono text-xs font-bold bg-nb-blue text-white px-1">R</span>
        </div>
        <div className="font-mono text-3xl font-black text-nb-ink">
          {overall.total_remaining}
        </div>
        <div className="font-mono text-[11px] text-zinc-600 mt-1 font-bold">
          Total Final: {overall.total_final}
        </div>
      </div>

      {/* 4. Must Attend For 75% */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between text-zinc-600 mb-1">
          <span className="font-heading uppercase text-xs font-black text-nb-red">Must Attend (75%)</span>
          <ShieldAlert className="w-4 h-4 text-nb-red" />
        </div>
        <div
          className={`font-mono text-3xl font-black ${
            overall.must_attend_75 > overall.total_remaining ? "text-nb-red animate-pulse" : "text-nb-ink"
          }`}
        >
          {overall.must_attend_75}
        </div>
        <div className="font-mono text-[11px] font-bold text-zinc-600 mt-1">
          {overall.must_attend_75 > overall.total_remaining ? "⚠ EXCEEDS REMAINING" : "to clear detention"}
        </div>
      </div>

      {/* 5. Safe To Bunk (75%) */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A]">
        <div className="flex items-center justify-between text-zinc-600 mb-1">
          <span className="font-heading uppercase text-xs font-black text-green-700">Safe To Skip (75%)</span>
          <CheckCircle2 className="w-4 h-4 text-nb-green" />
        </div>
        <div className="font-mono text-3xl font-black text-green-700">
          {overall.can_bunk_75}
        </div>
        <div className="font-mono text-[11px] font-bold text-zinc-600 mt-1">
          Max possible: {overall.max_possible_percentage}%
        </div>
      </div>
    </div>
  );
};
