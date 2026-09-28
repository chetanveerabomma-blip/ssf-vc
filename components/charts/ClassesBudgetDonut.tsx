"use client";

import React, { useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { SubjectCalculation } from "@/lib/engine";
import { Download } from "lucide-react";

export interface ClassesBudgetDonutProps {
  subjects: SubjectCalculation[];
}

export const ClassesBudgetDonut: React.FC<ClassesBudgetDonutProps> = ({ subjects }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCode, setSelectedCode] = useState(subjects[0]?.code || "");

  const activeSubject = subjects.find((s) => s.code === selectedCode) || subjects[0];

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `classes-budget-donut-${activeSubject?.code || "overall"}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("PNG export error:", e);
    }
  };

  if (!activeSubject) return null;

  // Segments:
  // 1. Attended so far
  // 2. Must attend (still needed to reach 75%)
  // 3. Can skip (safe bunks)
  // 4. Buffer to 90% (if any)
  const attended = activeSubject.attended_so_far;
  const mustAttend = activeSubject.must_attend_75;
  const canSkip = activeSubject.can_bunk_75;
  const buffer = Math.max(0, activeSubject.remaining_total - mustAttend - canSkip);

  const data = [
    { name: "Attended So Far", value: attended, color: "#6BCB77" },
    { name: "Must Attend (75%)", value: mustAttend, color: "#FFD93D" },
    { name: "Safe to Skip", value: canSkip, color: "#4D96FF" },
    { name: "Buffer Margin", value: buffer, color: "#B983FF" },
  ].filter((d) => d.value > 0);

  return (
    <div
      ref={containerRef}
      className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] space-y-4"
      aria-label="Classes budget donut chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-zinc-200 gap-2">
        <div>
          <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
            CLASSES BUDGET BREAKDOWN (DONUT)
          </h3>
          <p className="font-mono text-xs text-zinc-500">
            Attended vs. Mandatory Attendance vs. Safe Bunks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-2.5 py-1 font-mono text-xs font-bold border-2 border-nb-ink bg-white shadow-[2px_2px_0px_#0A0A0A]"
          >
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleDownloadPNG}
            className="font-mono text-xs font-bold text-zinc-700 hover:text-nb-ink flex items-center gap-1 p-1 border border-nb-ink bg-zinc-100 shadow-[1px_1px_0px_#0A0A0A]"
            title="Download chart as PNG"
          >
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              stroke="#0A0A0A"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-white border-[3px] border-nb-ink p-2 shadow-[3px_3px_0px_#0A0A0A] font-mono text-xs">
                      <strong>{item.name}:</strong> {item.value} classes
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "Space Mono",
                fontSize: 11,
                fontWeight: "bold",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="font-mono text-2xl font-black text-nb-ink leading-tight">
            {activeSubject.remaining_total}
          </span>
          <span className="font-heading uppercase text-[10px] font-black tracking-widest text-zinc-600">
            CLASSES LEFT
          </span>
        </div>
      </div>
    </div>
  );
};
