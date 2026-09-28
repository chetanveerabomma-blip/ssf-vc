"use client";

import React, { useRef, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  Legend,
} from "recharts";
import { SubjectCalculation, OverallCalculation } from "@/lib/engine";
import { format, addWeeks, parseISO, isAfter } from "date-fns";
import { Download } from "lucide-react";

export interface ProjectionLineChartProps {
  overall: OverallCalculation;
  todayDate: string; // "2026-09-28"
  simulatedBunksCount?: number;
}

export const ProjectionLineChart: React.FC<ProjectionLineChartProps> = ({
  overall,
  todayDate,
  simulatedBunksCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate weekly intervals from today (2026-09-28) to 2026-11-29 (9 weeks)
  const chartData = useMemo(() => {
    const points: any[] = [];
    let curr = parseISO(todayDate);
    const end = parseISO("2026-11-29");

    const totalRemaining = overall.total_remaining;
    const currentAttended = overall.total_attended;
    const currentHeld = overall.total_held;
    const totalFinal = overall.total_final;

    let weekIndex = 0;
    while (!isAfter(curr, end)) {
      const dateLabel = format(curr, "dd MMM");
      const progressFraction = weekIndex / 9;

      // 1. Attend Everything: attend all classes occurring up to this week
      const classesSoFarAttendAll = currentHeld + Math.round(totalRemaining * progressFraction);
      const attendedSoFarAttendAll = currentAttended + Math.round(totalRemaining * progressFraction);
      const attendEverythingPct = classesSoFarAttendAll > 0 ? (attendedSoFarAttendAll / classesSoFarAttendAll) * 100 : 100;

      // 2. Current Plan (including simulated leaves / bunks)
      const plannedBunksSoFar = Math.round(simulatedBunksCount * progressFraction);
      const attendedCurrentPlan = Math.max(0, attendedSoFarAttendAll - plannedBunksSoFar);
      const currentPlanPct = classesSoFarAttendAll > 0 ? (attendedCurrentPlan / classesSoFarAttendAll) * 100 : 100;

      // 3. Bunk Everything: attend 0 of the remaining classes
      const attendedBunkAll = currentAttended;
      const bunkEverythingPct = classesSoFarAttendAll > 0 ? (attendedBunkAll / classesSoFarAttendAll) * 100 : 100;

      points.push({
        date: dateLabel,
        rawDate: format(curr, "yyyy-MM-dd"),
        "Attend Everything": Number(attendEverythingPct.toFixed(1)),
        "Current Plan": Number(currentPlanPct.toFixed(1)),
        "Bunk Everything": Number(bunkEverythingPct.toFixed(1)),
      });

      curr = addWeeks(curr, 1);
      weekIndex++;
    }

    return points;
  }, [overall, todayDate, simulatedBunksCount]);

  // Find date when Current Plan crosses below 75%
  const crossPoint = useMemo(() => {
    return chartData.find((p) => p["Current Plan"] < 75.0);
  }, [chartData]);

  const handleDownloadPNG = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (containerRef.current) {
        const dataUrl = await toPng(containerRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `projection-line-chart-${todayDate}.png`;
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
      aria-label="Multi-scenario attendance projection chart"
    >
      <div className="flex items-center justify-between pb-3 border-b-[2px] border-zinc-200">
        <div>
          <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
            ATTENDANCE TRAJECTORY PROJECTION (WEEK-BY-WEEK)
          </h3>
          <p className="font-mono text-xs text-zinc-600">
            Simulating 100% attendance (Green), Current Plan with leaves (Blue), and Total Bunk (Red).
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

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <XAxis
              dataKey="date"
              stroke="#0A0A0A"
              strokeWidth={2}
              tick={{ fill: "#0A0A0A", fontSize: 11, fontFamily: "Space Mono", fontWeight: "bold" }}
            />
            <YAxis
              domain={[40, 100]}
              stroke="#0A0A0A"
              strokeWidth={2}
              tick={{ fill: "#0A0A0A", fontSize: 11, fontFamily: "Space Mono", fontWeight: "bold" }}
              unit="%"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border-[3px] border-nb-ink p-3 shadow-[4px_4px_0px_#0A0A0A] font-mono text-xs">
                      <div className="font-bold border-b border-zinc-300 pb-1 mb-1">Date: {label}</div>
                      <div className="text-green-700">Attend All: {payload[0]?.value}%</div>
                      <div className="text-blue-700">Current Plan: {payload[1]?.value}%</div>
                      <div className="text-nb-red">Bunk All: {payload[2]?.value}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "Space Grotesk",
                fontSize: 12,
                fontWeight: "bold",
                textTransform: "uppercase",
                paddingTop: 10,
              }}
            />

            {/* Threshold Lines */}
            <ReferenceLine
              y={75}
              stroke="#FF3B30"
              strokeWidth={3}
              strokeDasharray="4 4"
              label={{
                value: "75% DETENTION CUTOFF",
                fill: "#FF3B30",
                fontSize: 10,
                fontFamily: "Space Mono",
                fontWeight: "bold",
                position: "insideTopLeft",
              }}
            />
            <ReferenceLine
              y={90}
              stroke="#4D96FF"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: "90% TARGET",
                fill: "#4D96FF",
                fontSize: 10,
                fontFamily: "Space Mono",
                fontWeight: "bold",
                position: "insideTopRight",
              }}
            />

            {/* Red square marker on the date current plan crosses below 75% */}
            {crossPoint && (
              <ReferenceDot
                x={crossPoint.date}
                y={crossPoint["Current Plan"]}
                r={7}
                fill="#FF3B30"
                stroke="#0A0A0A"
                strokeWidth={3}
                label={{
                  value: `⚠ CROSSES 75% (${crossPoint.date})`,
                  fill: "#FF3B30",
                  fontSize: 10,
                  fontFamily: "Space Mono",
                  fontWeight: "bold",
                  position: "top",
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="Attend Everything"
              stroke="#6BCB77"
              strokeWidth={3.5}
              dot={{ r: 4, fill: "#6BCB77", stroke: "#0A0A0A", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Current Plan"
              stroke="#4D96FF"
              strokeWidth={3.5}
              dot={{ r: 4, fill: "#4D96FF", stroke: "#0A0A0A", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Bunk Everything"
              stroke="#FF3B30"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: "#FF3B30", stroke: "#0A0A0A" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
