import React from "react";
import { LeaveInput } from "@/lib/engine";
import { DEFAULT_POLICY } from "@/config/policy";
import { Trash2, AlertCircle, Calendar, Sparkles } from "lucide-react";

export interface LeaveListProps {
  leaves: LeaveInput[];
  onRemoveLeave: (id: string) => void;
  onClearAll: () => void;
  onOpenAddModal: () => void;
}

export const LeaveList: React.FC<LeaveListProps> = ({
  leaves,
  onRemoveLeave,
  onClearAll,
  onOpenAddModal,
}) => {
  const odLeavesCount = leaves.filter((l) => l.type === "OD").length;
  const isODOverLimit = odLeavesCount > DEFAULT_POLICY.maxODDaysPerSemester;

  const colorClasses = {
    OD: "bg-purple-100 border-nb-purple text-purple-950",
    MEDICAL: "bg-pink-100 border-nb-pink text-pink-950",
    ABSENT: "bg-yellow-100 border-nb-yellow text-yellow-950",
  };

  const badgeColors = {
    OD: "bg-nb-purple text-nb-ink",
    MEDICAL: "bg-nb-pink text-nb-ink",
    ABSENT: "bg-nb-yellow text-nb-ink",
  };

  return (
    <div className="space-y-4">
      {/* Active Policy Notice Bar */}
      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading uppercase text-xs font-black px-2 py-0.5 bg-nb-yellow border border-nb-ink">
              ACTIVE POLICY
            </span>
            <span className="font-mono text-xs font-bold text-zinc-700">
              OD = Present (+1) • Medical (Approved) = Present • Absent = Missed
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-600">
            Cap: Max {DEFAULT_POLICY.maxODDaysPerSemester} OD Days | Condonation: {DEFAULT_POLICY.maxMedicalCondonationPercent}%
          </div>
        </div>

        {isODOverLimit && (
          <div className="bg-nb-red text-white p-2 border-2 border-nb-ink font-mono text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Warning: Simulated OD entries exceed the semester quota of {DEFAULT_POLICY.maxODDaysPerSemester} days!
            </span>
          </div>
        )}
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="font-heading uppercase font-black text-sm text-nb-ink">
          Active Simulated Scenarios ({leaves.length})
        </div>

        <div className="flex items-center gap-2">
          {leaves.length > 0 && (
            <button
              onClick={onClearAll}
              className="font-mono text-xs font-bold text-nb-red underline hover:text-red-700 p-1"
            >
              Clear All Leaves
            </button>
          )}
          <button
            onClick={onOpenAddModal}
            className="font-heading uppercase text-xs font-black px-3 py-1.5 bg-nb-yellow text-nb-ink border-[2px] border-nb-ink shadow-[2px_2px_0px_#0A0A0A] hover:bg-yellow-400"
          >
            + Add Leave Scenario
          </button>
        </div>
      </div>

      {/* Leaves Cards / Chips */}
      {leaves.length === 0 ? (
        <div className="p-8 text-center bg-white border-[3px] border-nb-ink shadow-[3px_3px_0px_#0A0A0A]">
          <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h4 className="font-heading uppercase font-black text-xs text-zinc-700">
            No Leaves Simulated
          </h4>
          <p className="font-mono text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Add planned symposium On-Duty (OD) or sick leaves to preview how your attendance updates before you take them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leaves.map((l) => (
            <div
              key={l.id}
              className={`border-[2px] p-3 shadow-[3px_3px_0px_#0A0A0A] flex flex-col justify-between ${
                colorClasses[l.type]
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[10px] font-black uppercase px-1.5 py-0.5 border border-nb-ink ${
                      badgeColors[l.type]
                    }`}
                  >
                    {l.type}
                  </span>
                  {l.isAlreadyTaken ? (
                    <span className="font-mono text-[10px] bg-zinc-800 text-white px-1">PAST</span>
                  ) : (
                    <span className="font-mono text-[10px] bg-nb-blue text-white px-1">PLANNED</span>
                  )}
                  {l.medicalApproved && (
                    <span className="font-mono text-[10px] bg-green-700 text-white px-1">CERTIFIED</span>
                  )}
                </div>

                <button
                  onClick={() => l.id && onRemoveLeave(l.id)}
                  className="font-mono text-xs text-zinc-700 hover:text-nb-red p-0.5"
                  title="Remove scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="font-mono text-xs font-bold my-2 text-zinc-900">
                {l.startDate} {l.startDate !== l.endDate ? `→ ${l.endDate}` : ""}
                {l.isHalfDay && (
                  <span className="text-[10px] text-zinc-600 block">
                    Half-Day ({l.halfDayType})
                  </span>
                )}
              </div>

              {l.note && (
                <div className="font-mono text-[11px] text-zinc-600 truncate border-t border-zinc-300 pt-1">
                  Note: {l.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
