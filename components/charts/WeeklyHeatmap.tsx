"use client";

import React, { useRef, useMemo } from "react";
import { parseISO, format, addDays, isSunday, isBefore, isEqual } from "date-fns";
import { Holiday, WeekSchedule, DayKey, getDayKeyFromDate, isHoliday } from "@/lib/dates";
import { LeaveInput } from "@/lib/engine";
import { Download } from "lucide-react";

export interface WeeklyHeatmapProps {
  startDate?: string;
  endDate?: string;
  weekSchedule: WeekSchedule;
  holidays: Holiday[];
  leaves: LeaveInput[];
}

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({
  startDate = "2026-08-29",
  endDate = "2026-11-29",
  weekSchedule,
  holidays,
  leaves,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build grid of days
  const gridDays = useMemo(() => {
    const days: any[] = [];
    let curr = parseISO(startDate);
    const end = parseISO(endDate);

    while (isBefore(curr, end) || isEqual(curr, end)) {
      const dateStr = format(curr, "yyyy-MM-dd");
      const isSun = isSunday(curr);
      const isHol = isHoliday(dateStr, holidays);
      const dayKey: DayKey | null = getDayKeyFromDate(curr);
      const scheduledCount = dayKey && weekSchedule[dayKey] ? weekSchedule[dayKey]!.length : 0;

      // Find matching leaves
      const matchingLeave = leaves.find((l) => dateStr >= l.startDate && dateStr <= l.endDate);

      days.push({
        date: dateStr,
        dayOfWeek: dayKey || "SUN",
        isSunday: isSun,
        isHoliday: isHol,
        holidayName: holidays.find((h) => h.date === dateStr)?.name,
        scheduledCount,
        leaveType: matchingLeave?.type,
      });

      curr = addDays(curr, 1);
    }
    return days;
  }, [startDate, endDate, weekSchedule, holidays, leaves]);

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `attendance-calendar-heatmap-2026.png`;
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
      className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] space-y-4"
      aria-label="Weekly Calendar Heatmap with leaves and holidays"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-[2px] border-zinc-200 gap-2">
        <div>
          <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
            SEMESTER CALENDAR HEATMAP (AUG 29 – NOV 29)
          </h3>
          <p className="font-mono text-xs text-zinc-500">
            Holidays are hatched, leaves are color-coded (Purple = OD, Pink = Medical, Yellow = Absent).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-300 border border-nb-ink inline-block" /> OD
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-pink-300 border border-nb-ink inline-block" /> Medical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-300 border border-nb-ink inline-block" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 hazard-stripes border border-nb-ink inline-block" /> Holiday
            </span>
          </div>

          <button
            onClick={handleDownloadPNG}
            className="font-mono text-xs font-bold text-zinc-700 hover:text-nb-ink flex items-center gap-1 p-1 border border-nb-ink bg-zinc-100 shadow-[1px_1px_0px_#0A0A0A]"
            title="Download chart as PNG"
          >
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-16 lg:grid-cols-18 gap-1.5 pt-2">
        {gridDays.map((d) => {
          let bgClass = "bg-zinc-100 hover:bg-zinc-200 text-zinc-800";
          let borderClass = "border border-zinc-300";

          if (d.isHoliday) {
            bgClass = "hazard-stripes text-white font-black";
            borderClass = "border-2 border-nb-ink";
          } else if (d.isSunday) {
            bgClass = "bg-zinc-200 text-zinc-400 opacity-60";
          } else if (d.leaveType === "OD") {
            bgClass = "bg-nb-purple text-nb-ink font-bold";
            borderClass = "border-2 border-nb-ink";
          } else if (d.leaveType === "MEDICAL") {
            bgClass = "bg-nb-pink text-nb-ink font-bold";
            borderClass = "border-2 border-nb-ink";
          } else if (d.leaveType === "ABSENT") {
            bgClass = "bg-nb-yellow text-nb-ink font-bold";
            borderClass = "border-2 border-nb-ink";
          } else if (d.scheduledCount > 0) {
            bgClass = "bg-green-100 text-green-900 border border-green-600";
          }

          return (
            <div
              key={d.date}
              title={`${d.date} (${d.dayOfWeek}): ${
                d.isHoliday ? `Holiday - ${d.holidayName}` : `${d.scheduledCount} classes`
              }${d.leaveType ? ` [Leave: ${d.leaveType}]` : ""}`}
              className={`h-11 p-1 flex flex-col justify-between select-none cursor-pointer rounded-none text-left transition-transform hover:scale-105 ${bgClass} ${borderClass}`}
            >
              <div className="font-mono text-[9px] font-bold truncate">
                {d.date.substring(5)}
              </div>
              <div className="font-mono text-[10px] font-black self-end">
                {d.isHoliday ? "HOL" : d.isSunday ? "SUN" : d.scheduledCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
