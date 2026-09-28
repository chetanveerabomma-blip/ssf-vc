"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { NBBadge } from "@/components/nb/NBBadge";
import { clsx } from "clsx";
import { AlertCircle, Clock, Info, Snowflake, Users } from "lucide-react";

export interface RoomTileProps {
  statusData: RoomAvailabilityStatus;
}

export const RoomTile: React.FC<RoomTileProps> = ({ statusData }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { room, status, freeUntil, busyUntil, freeMinutes, currentBooking, nextBooking, conflictingBookings } =
    statusData;

  const statusConfig = {
    FREE: {
      bg: "bg-[#6BCB77]",
      border: "border-black",
      text: "text-black",
      label: "FREE",
      subtext: freeUntil ? `FREE UNTIL ${freeUntil} (${freeMinutes}m)` : "FREE NOW",
    },
    FREE_SOON: {
      bg: "bg-[#FFD93D]",
      border: "border-black",
      text: "text-black",
      label: "FREE SOON",
      subtext: `OCCUPIED IN ${freeMinutes}m (${freeUntil})`,
    },
    OCCUPIED: {
      bg: "bg-[#FF3B30]",
      border: "border-black",
      text: "text-white",
      label: "OCCUPIED",
      subtext: busyUntil ? `BUSY UNTIL ${busyUntil}` : "BUSY",
    },
    DATA_CONFLICT: {
      bg: "bg-[#B983FF] bg-[repeating-linear-gradient(45deg,#B983FF,#B983FF_10px,#a56afc_10px,#a56afc_20px)]",
      border: "border-black",
      text: "text-black",
      label: "DATA CONFLICT",
      subtext: "OVERLAPPING BOOKINGS",
    },
    NO_CLASSES: {
      bg: "bg-[#E5E7EB] bg-[repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6_10px,#E5E7EB_10px,#E5E7EB_20px)]",
      border: "border-black",
      text: "text-gray-800",
      label: "NO CLASSES",
      subtext: "HOLIDAY / WEEKEND",
    },
  };

  const currentConfig = statusConfig[status] || statusConfig.FREE;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Link href={`/rooms/${room.id}`}>
        <div
          tabIndex={0}
          className={clsx(
            "relative flex flex-col justify-between p-3.5 h-[135px] border-[3px] border-black rounded-[4px]",
            "shadow-[4px_4px_0px_#0A0A0A] transition-all duration-100",
            "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0A0A0A] active:translate-x-1 active:translate-y-1 active:shadow-none",
            "focus:outline-none focus:ring-4 focus:ring-black",
            status === "FREE_SOON" && "motion-safe:animate-pulse-once",
            currentConfig.bg,
            currentConfig.text
          )}
        >
          {/* Header: Room ID + Status Pill */}
          <div className="flex items-start justify-between gap-1">
            <span className="font-mono text-2xl font-black tracking-tight leading-none">
              {room.label || room.id}
            </span>
            <span
              className={clsx(
                "px-2 py-0.5 text-[10px] font-black font-mono uppercase tracking-wider rounded-[2px] border-2 border-black shadow-[1px_1px_0px_#0A0A0A]",
                status === "OCCUPIED" ? "bg-white text-black" : "bg-black text-white"
              )}
            >
              {currentConfig.label}
            </span>
          </div>

          {/* Middle: Free/Busy timer line */}
          <div className="my-auto">
            <p className="font-mono text-xs font-black tracking-wide uppercase line-clamp-1">
              {currentConfig.subtext}
            </p>
            {currentBooking && (
              <p className="font-sans text-[11px] font-bold opacity-90 truncate">
                {currentBooking.sectionLabel} • Slot {currentBooking.slot}
              </p>
            )}
            {status === "DATA_CONFLICT" && conflictingBookings && (
              <p className="font-mono text-[10px] font-black text-red-950 uppercase truncate">
                {conflictingBookings.length} classes overlap!
              </p>
            )}
          </div>

          {/* Footer: Metadata badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-black/20">
            {room.type !== "CLASSROOM" && (
              <NBBadge size="sm" variant="default" className="text-[9px] bg-white text-black">
                {room.type}
              </NBBadge>
            )}
            {room.ac === true ? (
              <NBBadge size="sm" variant="blue" className="text-[9px]">
                <Snowflake size={10} /> AC
              </NBBadge>
            ) : room.ac === false ? (
              <NBBadge size="sm" variant="gray" className="text-[9px]">
                NON-AC
              </NBBadge>
            ) : (
              <NBBadge size="sm" variant="yellow" className="text-[9px]">
                AC ?
              </NBBadge>
            )}
            {room.capacity ? (
              <NBBadge size="sm" variant="default" className="text-[9px]">
                <Users size={10} /> {room.capacity}
              </NBBadge>
            ) : (
              <NBBadge size="sm" variant="gray" className="text-[9px]">
                SEATS ?
              </NBBadge>
            )}
          </div>
        </div>
      </Link>

      {/* Hover / Focus Details Drawer Card */}
      {isHovered && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-white text-black border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] pointer-events-none text-left animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
            <span className="font-heading font-black text-sm uppercase">
              {room.label || room.id}
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 bg-[#FFD93D] border border-black">
              {room.floor !== null ? `Floor ${room.floor}` : "Unmapped"}
            </span>
          </div>

          {status === "DATA_CONFLICT" && conflictingBookings ? (
            <div className="space-y-1 mb-2 text-xs font-mono text-red-600 font-bold bg-red-50 p-2 border border-red-500 rounded">
              <div className="flex items-center gap-1">
                <AlertCircle size={14} /> Conflicting Bookings:
              </div>
              {conflictingBookings.map((cb, idx) => (
                <div key={idx} className="text-[11px] text-black">
                  • {cb.sectionLabel}: Slot {cb.slot} ({cb.subjectName || cb.slot})
                </div>
              ))}
            </div>
          ) : currentBooking ? (
            <div className="mb-2 text-xs font-sans">
              <span className="font-mono text-[10px] text-red-600 uppercase font-bold block">
                Current Class:
              </span>
              <div className="font-bold text-sm">{currentBooking.subjectName || currentBooking.slot}</div>
              <div className="font-mono text-[11px] text-gray-700">
                {currentBooking.sectionLabel} (Slot {currentBooking.slot})
              </div>
            </div>
          ) : (
            <div className="mb-2 text-xs font-sans text-green-700 font-bold flex items-center gap-1">
              <Clock size={12} /> Currently vacant and available
            </div>
          )}

          {nextBooking ? (
            <div className="pt-1.5 border-t border-gray-300 text-xs font-sans">
              <span className="font-mono text-[10px] text-gray-500 uppercase font-bold block">
                Next Up at {nextBooking.startPeriod ? `P${nextBooking.startPeriod}` : ""}:
              </span>
              <div className="font-bold text-xs truncate">
                {nextBooking.subjectName || nextBooking.slot} ({nextBooking.sectionLabel})
              </div>
            </div>
          ) : (
            <div className="pt-1 text-[11px] font-mono text-gray-500">
              No further classes scheduled today.
            </div>
          )}

          <div className="mt-2 pt-1 border-t border-black text-[10px] font-mono text-gray-600 flex justify-between">
            <span>Click tile for timeline</span>
            <span>{room.notes || ""}</span>
          </div>
        </div>
      )}
    </div>
  );
};
