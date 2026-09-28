"use client";

import React, { useRef, useState } from "react";
import { SubjectCalculation } from "@/lib/engine";
import { Download } from "lucide-react";
import { NBCard } from "../nb/NBCard";
import { NBBadge } from "../nb/NBBadge";

export interface SubjectComparisonBarsProps {
  subjects: SubjectCalculation[];
  onSelectSubject?: (code: string) => void;
}

export const SubjectComparisonBars: React.FC<SubjectComparisonBarsProps> = ({
  subjects,
  onSelectSubject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDrawerSubject, setSelectedDrawerSubject] = useState<SubjectCalculation | null>(null);

  // Sort ascending (worst attendance first)
  const sortedSubjects = [...subjects].sort(
    (a, b) => a.current_percentage - b.current_percentage
  );

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `subject-comparison-bars-${new Date().toISOString().split("T")[0]}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("PNG export error:", e);
    }
  };

  const getColorClass = (sub: SubjectCalculation) => {
    if (sub.status === "IRREVERSIBLE") return "hazard-stripes";
    if (sub.current_percentage >= 90) return "bg-nb-green";
    if (sub.current_percentage >= 75) return "bg-nb-yellow";
    return "bg-nb-red";
  };

  return (
    <div
      ref={containerRef}
      className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] space-y-4"
      aria-label="Subject Comparison Horizontal Bar Chart"
    >
      <div className="flex items-center justify-between pb-3 border-b-[2px] border-zinc-200">
        <div>
          <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
            SUBJECT ATTENDANCE STANDING (WORST FIRST)
          </h3>
          <p className="font-mono text-xs text-zinc-500">
            Click on any subject bar to inspect detailed session counts &amp; recovery quotas.
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

      {/* Axis markers header */}
      <div className="relative w-full h-5 font-mono text-[10px] font-bold text-zinc-600 border-b border-zinc-200">
        <span className="absolute left-[20%]">0%</span>
        <span className="absolute left-[75%] -translate-x-1/2 text-nb-red font-black">
          | 75%
        </span>
        <span className="absolute left-[90%] -translate-x-1/2 text-blue-700 font-black">
          | 90%
        </span>
        <span className="absolute right-0">100%</span>
      </div>

      {/* Bars Stack */}
      <div className="space-y-3 relative">
        {/* Vertical Reference Guide Lines */}
        <div className="absolute top-0 bottom-0 left-[75%] w-[2px] border-l-2 border-dashed border-nb-red pointer-events-none z-10 opacity-70" />
        <div className="absolute top-0 bottom-0 left-[90%] w-[2px] border-l-2 border-dashed border-blue-600 pointer-events-none z-10 opacity-70" />

        {sortedSubjects.map((sub) => {
          const widthPct = Math.min(100, Math.max(0, sub.current_percentage));
          return (
            <div
              key={sub.code}
              onClick={() => {
                setSelectedDrawerSubject(sub);
                if (onSelectSubject) onSelectSubject(sub.code);
              }}
              className="group cursor-pointer hover:bg-zinc-50 p-1.5 transition-colors border border-transparent hover:border-nb-ink"
            >
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1">
                <span className="group-hover:underline">
                  {sub.code}: {sub.name}
                </span>
                <span className="font-black text-sm">{sub.current_percentage}%</span>
              </div>

              {/* Bar track */}
              <div className="w-full h-6 bg-zinc-100 border-[2px] border-nb-ink shadow-[2px_2px_0px_#0A0A0A] relative overflow-hidden">
                <div
                  className={`h-full border-r-2 border-nb-ink transition-all duration-300 ${getColorClass(sub)}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible table fallback */}
      <table className="sr-only">
        <caption>Subject attendance comparison</caption>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Attendance Percentage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedSubjects.map((s) => (
            <tr key={s.code}>
              <td>{s.name} ({s.code})</td>
              <td>{s.current_percentage}%</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Subject Detail Drawer / Modal */}
      {selectedDrawerSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border-[4px] border-nb-ink shadow-[8px_8px_0px_#0A0A0A] max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b-[2px] border-nb-ink pb-2">
              <div>
                <h4 className="font-heading font-black text-base uppercase">
                  {selectedDrawerSubject.code} - {selectedDrawerSubject.name}
                </h4>
                <NBBadge status={selectedDrawerSubject.status} size="sm" />
              </div>
              <button
                onClick={() => setSelectedDrawerSubject(null)}
                className="font-mono font-black text-sm px-2 py-0.5 border-2 border-nb-ink bg-zinc-100 hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs bg-zinc-50 p-3 border-2 border-nb-ink">
              <div>Held: <strong>{selectedDrawerSubject.held_so_far}</strong></div>
              <div>Attended: <strong>{selectedDrawerSubject.attended_so_far}</strong></div>
              <div>Remaining: <strong>{selectedDrawerSubject.remaining_total}</strong></div>
              <div>Final Total: <strong>{selectedDrawerSubject.total_final}</strong></div>
              <div className="col-span-2 text-nb-red font-bold">
                Must Attend for 75%: <strong>{selectedDrawerSubject.must_attend_75}</strong> classes
              </div>
              <div className="col-span-2 text-green-700 font-bold">
                Safe to Bunk: <strong>{selectedDrawerSubject.can_bunk_75}</strong> classes
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDrawerSubject(null)}
                className="font-heading uppercase text-xs font-bold px-4 py-2 bg-nb-yellow text-nb-ink border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
