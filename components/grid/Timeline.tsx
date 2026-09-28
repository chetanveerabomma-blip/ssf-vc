"use client";

import React from "react";
import { Booking, RoomAvailabilityStatus } from "@/lib/engine";
import { formatMinutesToTime, timeStringToMinutes } from "@/lib/time";
import Link from "next/link";
import { clsx } from "clsx";

export interface TimelineProps {
  roomsStatus: RoomAvailabilityStatus[];
  currentTime: string;
  allBookings: Booking[];
  dayStr: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  roomsStatus,
  currentTime,
  allBookings,
  dayStr,
}) => {
  const startMin = 480; // 08:00
  const endMin = 1080; // 18:00
  const totalMin = endMin - startMin; // 600 min

  const currentMin = timeStringToMinutes(currentTime);
  const nowPercent = Math.max(0, Math.min(100, ((currentMin - startMin) / totalMin) * 100));

  // Time markers every 1 hour (60 min)
  const hourMarkers: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) {
    hourMarkers.push(m);
  }

  // Breaks: Tea 10:40-10:50 (640-650), Lunch 12:30-13:20 (750-800), Tea 15:00-15:10 (900-910)
  const breaks = [
    { start: 640, end: 650, label: "TEA" },
    { start: 750, end: 800, label: "LUNCH" },
    { start: 900, end: 910, label: "TEA" },
  ];

  return (
    <div className="w-full bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] overflow-hidden">
      <div className="p-4 bg-[#FFF8E7] border-b-[3px] border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-heading font-black text-lg uppercase tracking-wider text-black">
            DAY TIMELINE & SCHEDULE (GANTT VIEW)
          </h3>
          <p className="font-mono text-xs text-gray-700">
            Horizontal Gantt view of all room allocations for {dayStr}. Red bars indicate scheduled classes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#FF3B30] border border-black inline-block rounded-xs" /> Class
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#6BCB77] border border-black inline-block rounded-xs" /> Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-gray-300 border border-black inline-block rounded-xs [background-image:repeating-linear-gradient(45deg,#bbb,#bbb_2px,#eee_2px,#eee_4px)]" /> Break
          </span>
        </div>
      </div>

      {/* Gantt Scroll Container */}
      <div className="overflow-x-auto relative">
        <div className="min-w-[900px] relative">
          {/* Header Row: Hours */}
          <div className="flex border-b-[2px] border-black bg-gray-100 font-mono text-xs font-black select-none sticky top-0 z-20">
            {/* Sticky Room Label Header */}
            <div className="w-36 flex-shrink-0 p-2.5 bg-gray-200 border-r-[2px] border-black sticky left-0 z-30 shadow-[2px_0px_0px_rgba(0,0,0,0.1)]">
              ROOM
            </div>
            {/* Hour columns */}
            <div className="flex-1 relative h-9">
              {hourMarkers.map((m) => {
                const leftPct = ((m - startMin) / totalMin) * 100;
                return (
                  <div
                    key={m}
                    className="absolute top-0 bottom-0 border-l border-black/30 pl-1 pt-1.5 text-[10px]"
                    style={{ left: `${leftPct}%` }}
                  >
                    {formatMinutesToTime(m)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Grid Body */}
          <div className="relative divide-y divide-gray-200">
            {/* Lunch & Tea Break Background Columns */}
            {breaks.map((brk, idx) => {
              const leftPct = ((brk.start - startMin) / totalMin) * 100;
              const widthPct = ((brk.end - brk.start) / totalMin) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 bg-gray-200/60 pointer-events-none z-0 border-x border-black/10 [background-image:repeating-linear-gradient(45deg,#ddd,#ddd_3px,#f3f4f6_3px,#f3f4f6_6px)]"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              );
            })}

            {/* Current Scrubbed Time Vertical Line */}
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-black z-20 pointer-events-none shadow-[1px_0px_0px_#FFD93D]"
              style={{ left: `calc(144px + (100% - 144px) * ${nowPercent / 100})` }}
            >
              <div className="sticky top-1 -translate-x-1/2 bg-black text-[#FFD93D] font-mono text-[9px] font-black px-1 py-0.5 rounded-[2px] shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                {currentTime}
              </div>
            </div>

            {/* Rows for each room */}
            {roomsStatus.map((statusData) => {
              const { room, status } = statusData;
              const roomBookings = allBookings.filter(
                (b) => b.roomId === room.id && b.day === dayStr
              );

              return (
                <div
                  key={room.id}
                  className="flex items-center hover:bg-yellow-50/50 transition-colors group relative h-12"
                >
                  {/* Sticky Room ID Column */}
                  <div className="w-36 flex-shrink-0 px-3 py-2 bg-white group-hover:bg-yellow-50 border-r-[2px] border-black sticky left-0 z-10 flex items-center justify-between">
                    <Link
                      href={`/rooms/${room.id}`}
                      className="font-mono text-sm font-black text-black hover:text-[#FF6B9D] hover:underline"
                    >
                      {room.label || room.id}
                    </Link>
                    <span
                      className={clsx(
                        "w-2.5 h-2.5 rounded-full border border-black",
                        status === "FREE" && "bg-[#6BCB77]",
                        status === "FREE_SOON" && "bg-[#FFD93D]",
                        status === "OCCUPIED" && "bg-[#FF3B30]",
                        status === "DATA_CONFLICT" && "bg-[#B983FF]",
                        status === "NO_CLASSES" && "bg-gray-400"
                      )}
                    />
                  </div>

                  {/* Day Bar with Bookings */}
                  <div className="flex-1 relative h-full">
                    {roomBookings.map((b) => {
                      const bStart = Math.max(startMin, b.startMin);
                      const bEnd = Math.min(endMin, b.endMin);
                      const leftPct = ((bStart - startMin) / totalMin) * 100;
                      const widthPct = Math.max(1, ((bEnd - bStart) / totalMin) * 100);

                      return (
                        <div
                          key={b.id}
                          className="absolute top-2 bottom-2 bg-[#FF3B30] text-white border-2 border-black rounded-[2px] px-1.5 py-0.5 text-[10px] font-mono font-bold truncate shadow-[2px_2px_0px_#0A0A0A] flex items-center z-10 hover:z-30 hover:scale-105 transition-transform"
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${b.sectionLabel} • Slot ${b.slot} (${b.subjectName || b.slot}) • ${formatMinutesToTime(b.startMin)} - ${formatMinutesToTime(b.endMin)}`}
                        >
                          <span className="truncate">
                            {b.sectionLabel} {b.slot}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
