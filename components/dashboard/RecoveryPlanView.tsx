import React from "react";
import { SubjectCalculation } from "@/lib/engine";
import { NBTable } from "../nb/NBTable";
import { NBBadge } from "../nb/NBBadge";
import { Target, Zap } from "lucide-react";

export interface RecoveryPlanViewProps {
  subjects: SubjectCalculation[];
  weeksRemaining: number;
}

export const RecoveryPlanView: React.FC<RecoveryPlanViewProps> = ({
  subjects,
  weeksRemaining,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-nb-yellow border-[3px] border-nb-ink p-4 shadow-[4px_4px_0px_#0A0A0A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-nb-ink flex-shrink-0" />
          <div>
            <h3 className="font-heading font-black text-base uppercase text-nb-ink tracking-wider">
              Weekly Recovery Schedule (Approx. {weeksRemaining} Weeks Left)
            </h3>
            <p className="font-mono text-xs text-zinc-800">
              Target quota of classes you must attend every single week to guarantee 75% or 90%
            </p>
          </div>
        </div>
        <div className="font-mono text-xs bg-white px-3 py-1.5 border-2 border-nb-ink font-black">
          Semester Closes: 29 Nov 2026
        </div>
      </div>

      <NBTable
        headers={[
          "Course Code & Name",
          "Type",
          "Current %",
          "Must Attend (75%)",
          "Weekly Target (75%)",
          "Target For 90%",
          "Weekly Target (90%)",
          "Feasibility Status",
        ]}
      >
        {subjects.map((sub) => {
          const isDetained = sub.status === "IRREVERSIBLE";
          return (
            <tr
              key={sub.code}
              className={`hover:bg-zinc-50 ${isDetained ? "bg-red-50" : ""}`}
            >
              <td className="px-3 py-3 font-bold border-r-[2px] border-nb-ink">
                <div className="font-mono text-xs text-zinc-900">{sub.code}</div>
                <div className="text-[11px] text-zinc-600 truncate max-w-xs">{sub.name}</div>
              </td>

              <td className="px-3 py-3 border-r-[2px] border-nb-ink">
                <span className="font-mono text-[10px] bg-zinc-200 px-1.5 py-0.5 border border-nb-ink">
                  {sub.type}
                </span>
              </td>

              <td className="px-3 py-3 font-bold border-r-[2px] border-nb-ink">
                <span className={sub.current_percentage < 75 ? "text-nb-red" : "text-green-700"}>
                  {sub.current_percentage}%
                </span>
              </td>

              <td className="px-3 py-3 font-black text-center border-r-[2px] border-nb-ink text-nb-ink">
                {sub.must_attend_75} / {sub.remaining_total}
              </td>

              <td className="px-3 py-3 font-black text-center border-r-[2px] border-nb-ink bg-yellow-50">
                {isDetained ? (
                  <span className="text-nb-red font-mono text-xs">UNACHIEVABLE</span>
                ) : (
                  <span className="text-nb-ink text-sm bg-nb-yellow px-2 py-0.5 border border-nb-ink">
                    {sub.weekly_target_75} / wk
                  </span>
                )}
              </td>

              <td className="px-3 py-3 font-bold text-center border-r-[2px] border-nb-ink">
                {sub.must_attend_90 > sub.remaining_total ? (
                  <span className="text-zinc-400">N/A</span>
                ) : (
                  `${sub.must_attend_90} classes`
                )}
              </td>

              <td className="px-3 py-3 font-bold text-center border-r-[2px] border-nb-ink">
                {sub.must_attend_90 > sub.remaining_total ? (
                  <span className="text-zinc-400">N/A</span>
                ) : (
                  <span className="text-blue-700 font-mono">
                    {sub.weekly_target_90} / wk
                  </span>
                )}
              </td>

              <td className="px-3 py-3">
                <NBBadge status={sub.status} size="sm" />
              </td>
            </tr>
          );
        })}
      </NBTable>
    </div>
  );
};
