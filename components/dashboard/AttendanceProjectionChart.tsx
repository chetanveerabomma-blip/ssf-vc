"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { SubjectCalculation } from "@/lib/engine";

export interface AttendanceProjectionChartProps {
  subjects: SubjectCalculation[];
}

export const AttendanceProjectionChart: React.FC<AttendanceProjectionChartProps> = ({
  subjects,
}) => {
  const data = subjects.map((s) => ({
    name: s.code,
    fullName: s.name,
    Current: s.current_percentage,
    "With Planned Skips": s.projected_percentage_with_skips,
    "Max Possible": s.max_possible_percentage,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = subjects.find((s) => s.code === label);
      return (
        <div className="bg-white border-[3px] border-nb-ink p-3 shadow-[4px_4px_0px_#0A0A0A] font-mono text-xs">
          <p className="font-heading font-black text-sm uppercase text-nb-ink mb-1">
            {label}: {item?.name}
          </p>
          <div className="space-y-1">
            <p className="text-zinc-800 font-bold">
              Current: <span className="text-yellow-600">{payload[0]?.value}%</span>
            </p>
            <p className="text-zinc-800 font-bold">
              With Planned Skips:{" "}
              <span className={payload[1]?.value < 75 ? "text-nb-red font-black" : "text-pink-600"}>
                {payload[1]?.value}%
              </span>
            </p>
            <p className="text-zinc-800 font-bold">
              Max Possible: <span className="text-green-600">{payload[2]?.value}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white border-[3px] border-nb-ink p-5 shadow-[6px_6px_0px_#0A0A0A]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-[3px] border-nb-ink mb-4 gap-2">
        <div>
          <h3 className="font-heading uppercase font-black text-base tracking-wider text-nb-ink">
            Attendance Trajectory &amp; Forecast
          </h3>
          <p className="font-mono text-xs text-zinc-600">
            Comparing Current Attendance vs. Planned Skips vs. Theoretical Maximum
          </p>
        </div>
        <div className="font-mono text-xs bg-nb-yellow px-2 py-1 border-2 border-nb-ink font-bold">
          Thresholds: 75% | 90%
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 25, left: 0, bottom: 15 }}>
            <XAxis
              dataKey="name"
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily: "Space Grotesk",
                fontSize: 12,
                fontWeight: "bold",
                textTransform: "uppercase",
                paddingTop: 10,
              }}
            />
            {/* 75% Detention Line */}
            <ReferenceLine
              y={75}
              stroke="#FF3B30"
              strokeWidth={3}
              strokeDasharray="4 4"
              label={{
                value: "75% DETENTION LINE",
                fill: "#FF3B30",
                fontSize: 10,
                fontFamily: "Space Mono",
                fontWeight: "bold",
                position: "insideTopLeft",
              }}
            />
            {/* 90% Target Line */}
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

            <Line
              type="monotone"
              dataKey="Current"
              stroke="#FFD93D"
              strokeWidth={3.5}
              dot={{ r: 5, fill: "#FFD93D", stroke: "#0A0A0A", strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: "#0A0A0A", strokeWidth: 3 }}
            />
            <Line
              type="monotone"
              dataKey="With Planned Skips"
              stroke="#FF6B9D"
              strokeWidth={3.5}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: "#FF6B9D", stroke: "#0A0A0A", strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: "#0A0A0A", strokeWidth: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Max Possible"
              stroke="#6BCB77"
              strokeWidth={3.5}
              dot={{ r: 5, fill: "#6BCB77", stroke: "#0A0A0A", strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: "#0A0A0A", strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
