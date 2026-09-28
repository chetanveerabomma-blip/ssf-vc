import React from "react";
import { LeaveSimulationResult } from "@/lib/engine";
import { NBBadge } from "../nb/NBBadge";
import { ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";

export interface BeforeAfterCardProps {
  simulation: LeaveSimulationResult;
  subjectName?: string;
}

export const BeforeAfterCard: React.FC<BeforeAfterCardProps> = ({
  simulation,
  subjectName,
}) => {
  const { before, after, delta, crossesThreshold75, becomesIrreversible } = simulation;

  return (
    <div
      className={`border-[3px] p-4 bg-white shadow-[4px_4px_0px_#0A0A0A] transition-all ${
        becomesIrreversible
          ? "border-nb-red bg-red-50/50 animate-nb-shake"
          : crossesThreshold75
          ? "border-nb-red"
          : "border-nb-ink"
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b-[2px] border-zinc-200">
        <div>
          <span className="font-heading font-black text-xs uppercase px-2 py-0.5 bg-nb-yellow border border-nb-ink">
            {simulation.subjectCode}
          </span>
          {subjectName && (
            <span className="font-mono text-xs font-bold text-zinc-700 ml-2">
              {subjectName}
            </span>
          )}
        </div>
        <NBBadge status={after.status} size="sm" />
      </div>

      {/* Comparison Strip */}
      <div className="grid grid-cols-3 gap-2 items-center my-3 text-center">
        {/* Before */}
        <div className="bg-zinc-50 p-2 border border-nb-ink">
          <span className="font-mono text-[10px] text-zinc-500 uppercase block font-bold">
            Before Leave
          </span>
          <span className="font-mono text-base font-black text-nb-ink">
            {before.percentage}%
          </span>
        </div>

        {/* Arrow & Delta */}
        <div className="flex flex-col items-center justify-center">
          <ArrowRight className="w-5 h-5 text-nb-ink mb-0.5" />
          <span
            className={`font-mono text-xs font-black px-1.5 py-0.2 border border-nb-ink shadow-[1px_1px_0px_#0A0A0A] ${
              delta < 0
                ? "bg-nb-red text-white"
                : delta > 0
                ? "bg-nb-green text-nb-ink"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {delta > 0 ? `+${delta}%` : `${delta}%`}
          </span>
        </div>

        {/* After */}
        <div
          className={`p-2 border border-nb-ink ${
            crossesThreshold75 ? "bg-red-100 text-nb-red" : "bg-zinc-50 text-nb-ink"
          }`}
        >
          <span className="font-mono text-[10px] text-zinc-500 uppercase block font-bold">
            After Leave
          </span>
          <span className="font-mono text-base font-black">
            {after.percentage}%
          </span>
        </div>
      </div>

      {/* Status Warning Banner */}
      {becomesIrreversible && (
        <div className="bg-nb-red text-white p-2 border-2 border-nb-ink font-mono text-[11px] font-bold flex items-center gap-1.5 mt-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span>⚠ WARNING: This leave pushes course into IRREVERSIBLE DETENTION!</span>
        </div>
      )}

      {crossesThreshold75 && !becomesIrreversible && (
        <div className="bg-yellow-100 border-2 border-nb-red p-2 font-mono text-[11px] font-bold text-red-800 flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-nb-red" />
          <span>Notice: Leaves breach the 75% detention threshold (need {after.must_attend_75} classes).</span>
        </div>
      )}

      <div className="flex justify-between items-center font-mono text-[11px] text-zinc-600 pt-2 border-t border-zinc-200">
        <span>Classes affected: <strong>{simulation.affectedPeriodsCount}</strong></span>
        <span>Remaining: <strong>{after.remaining}</strong> (Safe skips: <strong className="text-green-700">{after.can_bunk_75}</strong>)</span>
      </div>
    </div>
  );
};
