import React from "react";
import { SubjectCalculation, SubjectInput } from "@/lib/engine";
import { NBTable } from "../nb/NBTable";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export interface FutureSkipPlannerProps {
  subjects: SubjectCalculation[];
  onUpdateSkip: (code: string, skips: number) => void;
  planningDate: string;
}

export const FutureSkipPlanner: React.FC<FutureSkipPlannerProps> = ({
  subjects,
  onUpdateSkip,
  planningDate,
}) => {
  const hasBreachedSubjects = subjects.some((s) => s.plan_breaks_75);

  return (
    <div className="space-y-6">
      {hasBreachedSubjects && (
        <div className="bg-red-500 text-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 flex-shrink-0 animate-bounce" />
          <div>
            <h4 className="font-heading uppercase font-black text-sm tracking-wider">
              Warning: Planned Skips Cross the 75% Detention Threshold!
            </h4>
            <p className="font-mono text-xs mt-0.5">
              One or more subjects will drop below 75% by the end of the semester under your planned bunk schedule.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-black text-base uppercase text-nb-ink tracking-wider">
            Future Absence Simulation
          </h3>
          <p className="font-mono text-xs text-zinc-600">
            Simulate skipping classes up to {planningDate} and preview final semester percentage.
          </p>
        </div>
        <div className="font-mono text-xs bg-nb-blue text-white px-3 py-1 border-2 border-nb-ink font-bold">
          Target Plan Date: {planningDate}
        </div>
      </div>

      <NBTable
        headers={[
          "Subject",
          "Remaining Classes (R)",
          "Max Safe Skips (75%)",
          "Planned Skips",
          "Projected Attended",
          "Projected Final %",
          "Outcome Verdict",
        ]}
      >
        {subjects.map((sub) => {
          return (
            <tr
              key={sub.code}
              className={`hover:bg-zinc-50 ${sub.plan_breaks_75 ? "bg-red-50" : ""}`}
            >
              <td className="px-3 py-3 font-bold border-r-[2px] border-nb-ink">
                <div className="font-mono text-xs">{sub.code}</div>
                <div className="text-[11px] text-zinc-600 truncate max-w-xs">{sub.name}</div>
              </td>

              <td className="px-3 py-3 font-bold text-center border-r-[2px] border-nb-ink">
                {sub.remaining_total}
              </td>

              <td className="px-3 py-3 font-black text-center border-r-[2px] border-nb-ink text-green-700">
                {sub.can_bunk_75}
              </td>

              <td className="px-3 py-3 text-center border-r-[2px] border-nb-ink">
                <div className="inline-flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={sub.remaining_total}
                    value={sub.planned_skips}
                    onChange={(e) => onUpdateSkip(sub.code, parseInt(e.target.value) || 0)}
                    className={`w-16 px-2 py-1 font-mono text-xs text-center border-2 border-nb-ink shadow-[1px_1px_0px_#0A0A0A] ${
                      sub.plan_breaks_75 ? "bg-red-100 border-nb-red text-nb-red font-black" : "bg-white"
                    }`}
                  />
                  <span className="font-mono text-[10px] text-zinc-500">/ {sub.remaining_total}</span>
                </div>
              </td>

              <td className="px-3 py-3 font-mono font-bold text-center border-r-[2px] border-nb-ink">
                {sub.projected_attended_with_skips} / {sub.total_final}
              </td>

              <td className="px-3 py-3 font-mono font-black text-center border-r-[2px] border-nb-ink text-sm">
                <span className={sub.plan_breaks_75 ? "text-nb-red underline" : "text-nb-ink"}>
                  {sub.projected_percentage_with_skips}%
                </span>
              </td>

              <td className="px-3 py-3 font-heading font-black text-xs uppercase">
                {sub.plan_breaks_75 ? (
                  <span className="text-nb-red flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Breaches 75%
                  </span>
                ) : (
                  <span className="text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Safe to Proceed
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </NBTable>
    </div>
  );
};
