"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFloorStore } from "@/lib/store";
import { getRoomStatus, buildBookings, getFreeWindows } from "@/lib/engine";
import { getISTNow, formatIST, formatMinutesToTime } from "@/lib/time";
import { PERIOD_GRIDS, RULES } from "@/config/rules";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBButton } from "@/components/nb/NBButton";
import { NBSticker } from "@/components/nb/NBSticker";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Snowflake,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { clsx } from "clsx";

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.id as string) || "";

  const { rooms, enabledSections, strictReservation, selectedDate } = useFloorStore();
  const [selectedDay, setSelectedDay] = useState<"MON" | "TUE" | "WED" | "THU" | "FRI">("MON");

  const room = rooms.find(
    (r) => r.id.toLowerCase() === roomId.toLowerCase() || r.id === roomId
  );

  const now = getISTNow();
  const bookings = useMemo(() => {
    return buildBookings(undefined, { strictReservation });
  }, [strictReservation]);

  const currentStatus = useMemo(() => {
    if (!room) return null;
    return getRoomStatus(room.id, now, { bookings, rooms, strictReservation });
  }, [room, now, bookings, rooms, strictReservation]);

  const weekDays: Array<"MON" | "TUE" | "WED" | "THU" | "FRI"> = [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ];

  const dayBookings = useMemo(() => {
    if (!room) return [];
    return bookings
      .filter((b) => b.roomId === room.id && b.day === selectedDay)
      .sort((a, b) => a.startMin - b.startMin);
  }, [room, bookings, selectedDay]);

  const dayFreeWindows = useMemo(() => {
    if (!room) return [];
    const dummyDate = new Date(`2026-09-28T12:00:00+05:30`); // Monday
    // Adjust day
    const dayOffsets: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4 };
    dummyDate.setDate(dummyDate.getDate() + (dayOffsets[selectedDay] || 0));
    return getFreeWindows(room.id, dummyDate, { bookings });
  }, [room, bookings, selectedDay]);

  if (!room) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-heading font-black text-3xl uppercase text-black">ROOM NOT FOUND</h1>
        <p className="font-mono text-xs text-gray-700">Room "{roomId}" is not in the SRM EEE registry.</p>
        <Link href="/grid">
          <NBButton variant="yellow">BACK TO FLOOR GRID</NBButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/grid"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-black uppercase text-black hover:text-[#FF6B9D]"
        >
          <ArrowLeft size={16} /> BACK TO FLOOR GRID
        </Link>
      </div>

      {/* Room Hero Header Card */}
      <div className="p-6 bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <NBSticker color="yellow" rotate="-1">
              {room.floor !== null ? `FLOOR ${room.floor}` : "UNMAPPED FLOOR"}
            </NBSticker>
            <NBBadge variant="default" size="md">
              {room.type}
            </NBBadge>
          </div>

          <h1 className="font-mono font-black text-4xl sm:text-5xl text-black">
            {room.label || room.id}
          </h1>

          <p className="font-sans text-sm text-gray-700 font-medium">
            {room.notes || `Designated ${room.type} in SRM Trichy EEE department.`}
          </p>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {room.ac === true ? (
              <NBBadge variant="blue">
                <Snowflake size={12} /> AIR CONDITIONED
              </NBBadge>
            ) : room.ac === false ? (
              <NBBadge variant="gray">NON-AC</NBBadge>
            ) : (
              <NBBadge variant="yellow">AC UNVERIFIED</NBBadge>
            )}

            {room.capacity ? (
              <NBBadge variant="default">
                <Users size={12} /> {room.capacity} SEATS
              </NBBadge>
            ) : (
              <NBBadge variant="gray">CAPACITY UNRECORDED</NBBadge>
            )}
          </div>
        </div>

        {/* Current Live State Box */}
        {currentStatus && (
          <div className="p-4 bg-[#FFF8E7] border-2 border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2 min-w-[220px]">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-600 block">
              STATUS RIGHT NOW (IST)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "px-2.5 py-1 font-mono text-sm font-black uppercase rounded-[2px] border-2 border-black",
                  currentStatus.status === "FREE" && "bg-[#6BCB77] text-black",
                  currentStatus.status === "FREE_SOON" && "bg-[#FFD93D] text-black",
                  currentStatus.status === "OCCUPIED" && "bg-[#FF3B30] text-white",
                  currentStatus.status === "DATA_CONFLICT" && "bg-[#B983FF] text-black",
                  currentStatus.status === "NO_CLASSES" && "bg-gray-200 text-gray-800"
                )}
              >
                {currentStatus.status.replace("_", " ")}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-black pt-1">
              {currentStatus.freeUntil && `Free until ${currentStatus.freeUntil}`}
              {currentStatus.busyUntil && `Busy until ${currentStatus.busyUntil}`}
            </div>
          </div>
        )}
      </div>

      {/* Day Selector Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-black">
            SCHEDULE & FREE WINDOWS
          </h2>
          <span className="font-mono text-xs text-gray-600 font-bold">
            TIMETABLE: MON - FRI
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {weekDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={clsx(
                "px-5 py-2.5 font-heading font-black text-sm uppercase rounded-[2px] border-[3px] border-black transition-all",
                selectedDay === d
                  ? "bg-[#FFD93D] text-black shadow-[4px_4px_0px_#0A0A0A] -translate-y-0.5"
                  : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#0A0A0A]"
              )}
            >
              {d === "MON" && "MONDAY"}
              {d === "TUE" && "TUESDAY"}
              {d === "WED" && "WEDNESDAY"}
              {d === "THU" && "THURSDAY"}
              {d === "FRI" && "FRIDAY"}
            </button>
          ))}
        </div>
      </div>

      {/* Free Windows on Selected Day */}
      <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-3">
        <h3 className="font-heading font-black text-lg uppercase text-black flex items-center gap-2">
          <CheckCircle size={18} className="text-[#6BCB77]" />
          AVAILABLE FREE WINDOWS ON {selectedDay}
        </h3>
        {dayFreeWindows.length === 0 ? (
          <p className="font-mono text-xs text-gray-600">No free windows available on this day.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dayFreeWindows.map((win, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#6BCB77]/15 border-2 border-black rounded-[2px] font-mono shadow-[2px_2px_0px_#0A0A0A]"
              >
                <div className="text-base font-black text-black">
                  {win.startTime} → {win.endTime}
                </div>
                <div className="text-xs font-bold text-gray-700 mt-0.5">
                  {win.minutes} minutes continuous
                </div>
                {win.crossesLunch && (
                  <span className="text-[10px] text-gray-500 block mt-1">Includes lunch break</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Classes Table for Selected Day */}
      <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
        <h3 className="font-heading font-black text-lg uppercase text-black flex items-center gap-2">
          <Clock size={18} className="text-[#FF6B9D]" />
          SCHEDULED OCCUPANCY ON {selectedDay}
        </h3>

        {dayBookings.length === 0 ? (
          <div className="p-6 bg-[#FFFDF7] border-2 border-black rounded text-center font-mono text-xs text-gray-700">
            No classes scheduled in {room.label || room.id} on {selectedDay}. The room is entirely
            free throughout campus hours (08:00 - 18:00).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-gray-100 border-b-2 border-black text-black">
                <tr>
                  <th className="p-2.5 font-heading font-black">TIME INTERVAL</th>
                  <th className="p-2.5 font-heading font-black">PERIODS</th>
                  <th className="p-2.5 font-heading font-black">SECTION</th>
                  <th className="p-2.5 font-heading font-black">SLOT</th>
                  <th className="p-2.5 font-heading font-black">SUBJECT / COURSE</th>
                  <th className="p-2.5 font-heading font-black">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {dayBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-yellow-50/50">
                    <td className="p-2.5 font-black text-sm">
                      {formatMinutesToTime(b.startMin)} - {formatMinutesToTime(b.endMin)}
                    </td>
                    <td className="p-2.5 font-bold">
                      P{b.startPeriod}
                      {b.endPeriod > b.startPeriod ? `-P${b.endPeriod}` : ""}
                    </td>
                    <td className="p-2.5 font-bold text-black">{b.sectionLabel}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 bg-[#FFD93D] border border-black font-black rounded-[2px]">
                        {b.slot}
                      </span>
                    </td>
                    <td className="p-2.5 font-sans font-bold text-gray-900">
                      {b.subjectName || b.slot}
                    </td>
                    <td className="p-2.5 font-bold">
                      <NBBadge size="sm" variant={b.kind === "LAB" ? "purple" : "default"}>
                        {b.kind}
                      </NBBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
