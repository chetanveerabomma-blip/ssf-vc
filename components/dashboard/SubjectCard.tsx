"use client";

import React from "react";
import { SubjectCalculation, SubjectInput } from "@/lib/engine";
import { NBBadge } from "../nb/NBBadge";
import { NBProgressBar } from "../nb/NBProgressBar";
import { AlertTriangle, Check, SlidersHorizontal } from "lucide-react";

export interface SubjectCardProps {
  calc: SubjectCalculation;
  input: Partial<SubjectInput>;
  onInputChange: (updates: Partial<SubjectInput>) => void;
  maxScheduledHeld: number;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  calc,
  input,
  onInputChange,
  maxScheduledHeld,
}) => {
  const isModeCounts = (input.mode || "COUNTS") === "COUNTS";
  const isIrreversible = calc.status === "IRREVERSIBLE";

  return (
    <div
      id={`subject-${calc.code}`}
      className={`border-[3px] border-nb-ink p-5 shadow-[6px_6px_0px_#0A0A0A] transition-all bg-white scroll-mt-24 ${
        isIrreversible ? "border-nb-red ring-2 ring-nb-red/30" : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-nb-ink gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm uppercase px-2 py-0.5 bg-nb-yellow border border-nb-ink shadow-[1px_1px_0px_#0A0A0A]">
              {calc.code}
            </span>
            <span className="font-mono text-[11px] font-bold text-zinc-500 uppercase">
              {calc.type}
            </span>
          </div>
          <h4 className="font-heading font-black text-base uppercase text-nb-ink mt-1">
            {calc.name}
          </h4>
        </div>
        <div>
          <NBBadge status={calc.status} size="md" />
        </div>
      </div>

      {/* Big Numbers & Decision Guidance */}
      <div className="grid grid-cols-2 gap-3 my-4 bg-zinc-50 border-[2px] border-nb-ink p-3">
        <div className="border-r-[2px] border-nb-ink pr-3">
          <div className="font-heading uppercase text-[11px] font-black text-zinc-600">
            Attendance Target (75%)
          </div>
          <div
            className={`font-mono text-2xl font-black mt-1 ${
              isIrreversible ? "text-nb-red" : "text-nb-ink"
            }`}
          >
            {isIrreversible ? (
              <span className="text-sm font-bold text-nb-red block">CANNOT REACH 75%</span>
            ) : calc.must_attend_75 === 0 ? (
              <span className="text-green-700 text-lg">SAFE (0 NEEDED)</span>
            ) : (
              `ATTEND ${calc.must_attend_75} MORE`
            )}
          </div>
          <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
            Out of {calc.remaining_total} remaining classes
          </div>
        </div>

        <div className="pl-1">
          <div className="font-heading uppercase text-[11px] font-black text-zinc-600">
            Bunk Capacity
          </div>
          <div className="font-mono text-2xl font-black text-green-700 mt-1">
            {calc.can_bunk_75 > 0 ? (
              `YOU CAN SKIP ${calc.can_bunk_75}`
            ) : (
              <span className="text-nb-red text-lg">0 SKIPS ALLOWED</span>
            )}
          </div>
          <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
            To 90% target: {calc.can_bunk_90 > 0 ? `Can skip ${calc.can_bunk_90}` : `Need ${calc.must_attend_90} classes`}
          </div>
        </div>
      </div>

      {/* Irreversible Action Banner */}
      {isIrreversible && (
        <div className="my-3 p-2.5 bg-red-50 border-2 border-nb-red flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#E11D48]">
          <div className="flex items-center gap-1.5 font-mono text-xs text-nb-red font-bold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Detention Unavoidable (Max {calc.max_possible_percentage}%)</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onInputChange({ mode: "PERCENTAGE", percentage: 75.0, plannedSkips: 0 })}
              className="px-2 py-1 bg-white text-nb-ink border border-nb-ink text-[11px] font-mono font-bold hover:bg-nb-yellow shadow-[1px_1px_0px_#0A0A0A] active:translate-x-0.5"
            >
              Action: Reset to 75%
            </button>
            <button
              onClick={() => onInputChange({ plannedSkips: 0 })}
              className="px-2 py-1 bg-nb-yellow text-nb-ink border border-nb-ink text-[11px] font-mono font-bold hover:bg-yellow-400 shadow-[1px_1px_0px_#0A0A0A] active:translate-x-0.5"
            >
              Clear Skips (0)
            </button>
          </div>
        </div>
      )}

      {/* Chunky Progress Bar */}
      <div className="my-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-heading uppercase text-xs font-black text-zinc-700">
            Current: <strong className="font-mono text-sm text-nb-ink">{calc.current_percentage}%</strong>
          </span>
          <span className="font-mono text-xs font-bold text-zinc-600">
            {calc.attended_so_far} / {calc.held_so_far} held
          </span>
        </div>
        <NBProgressBar value={calc.current_percentage} maxPossible={calc.max_possible_percentage} />
      </div>

      {/* Input Mode Controls */}
      <div className="mt-4 pt-3 border-t-[2px] border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-heading uppercase text-xs font-bold text-zinc-700 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Input Mode
          </span>
          <div className="flex border-[2px] border-nb-ink overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
            <button
              onClick={() => onInputChange({ mode: "COUNTS" })}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors ${
                isModeCounts ? "bg-nb-yellow text-nb-ink" : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Counts (Exact)
            </button>
            <button
              onClick={() => onInputChange({ mode: "PERCENTAGE" })}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border-l-2 border-nb-ink transition-colors ${
                !isModeCounts ? "bg-nb-yellow text-nb-ink" : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Inputs */}
        {isModeCounts ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
                Attended Classes:
              </label>
              <input
                type="number"
                min="0"
                max={input.held || maxScheduledHeld}
                value={input.attended !== undefined ? input.attended : calc.attended_so_far}
                onChange={(e) => onInputChange({ attended: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 font-mono text-sm border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
                Held So Far (Max {maxScheduledHeld}):
              </label>
              <input
                type="number"
                min="1"
                max={maxScheduledHeld}
                value={input.held !== undefined ? input.held : calc.held_so_far}
                onChange={(e) => onInputChange({ held: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 font-mono text-sm border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block font-mono text-[11px] font-bold text-zinc-700">
                Attendance Percentage (%):
              </label>
              <span className="font-mono text-xs text-zinc-500">
                Assumes ~{calc.attended_so_far} / {calc.held_so_far} classes
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={input.percentage !== undefined ? input.percentage : calc.current_percentage}
              onChange={(e) => onInputChange({ percentage: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 font-mono text-sm border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
            />
          </div>
        )}

        {/* Future planned skips field */}
        <div className="mt-3 bg-zinc-100 p-2.5 border-[2px] border-nb-ink flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="font-heading uppercase text-[11px] font-bold text-zinc-800 block">
              Plan To Skip Before End:
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              Projected: {calc.projected_percentage_with_skips}%
              {calc.plan_breaks_75 && (
                <span className="text-nb-red font-bold ml-1">⚠ Plan breaches 75%!</span>
              )}
            </span>
          </div>
          <div className="w-20">
            <input
              type="number"
              min="0"
              max={calc.remaining_total}
              value={input.plannedSkips || 0}
              onChange={(e) => onInputChange({ plannedSkips: parseInt(e.target.value) || 0 })}
              className={`w-full px-2 py-1 font-mono text-xs text-center border-2 border-nb-ink ${
                calc.plan_breaks_75 ? "bg-red-100 border-nb-red text-nb-red font-black" : "bg-white"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
