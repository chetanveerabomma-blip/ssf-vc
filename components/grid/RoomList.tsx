"use client";

import React, { useState } from "react";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { NBBadge } from "@/components/nb/NBBadge";
import Link from "next/link";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { clsx } from "clsx";

export interface RoomListProps {
  roomsStatus: RoomAvailabilityStatus[];
}

export const RoomList: React.FC<RoomListProps> = ({ roomsStatus }) => {
  const [sortField, setSortField] = useState<"id" | "floor" | "status" | "freeUntil">("floor");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedRooms = [...roomsStatus].sort((a, b) => {
    let cmp = 0;
    if (sortField === "id") {
      cmp = a.roomId.localeCompare(b.roomId);
    } else if (sortField === "floor") {
      const fa = a.room.floor ?? -1;
      const fb = b.room.floor ?? -1;
      cmp = fa - fb;
    } else if (sortField === "status") {
      cmp = a.status.localeCompare(b.status);
    } else if (sortField === "freeUntil") {
      const fma = a.freeMinutes ?? 0;
      const fmb = b.freeMinutes ?? 0;
      cmp = fma - fmb;
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="w-full bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] overflow-hidden">
      <div className="p-4 bg-[#FFF8E7] border-b-[3px] border-black flex justify-between items-center">
        <div>
          <h3 className="font-heading font-black text-lg uppercase tracking-wider text-black">
            ROOM AVAILABILITY DIRECTORY
          </h3>
          <p className="font-mono text-xs text-gray-700">
            Sortable list of all {roomsStatus.length} rooms and their real-time state.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-gray-100 border-b-2 border-black text-black select-none">
            <tr>
              <th
                onClick={() => handleSort("id")}
                className="p-3 font-heading font-black text-xs uppercase cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-1">
                  ROOM <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => handleSort("floor")}
                className="p-3 font-heading font-black text-xs uppercase cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-1">
                  FLOOR <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3 font-heading font-black text-xs uppercase">TYPE</th>
              <th
                onClick={() => handleSort("status")}
                className="p-3 font-heading font-black text-xs uppercase cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-1">
                  CURRENT STATUS <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => handleSort("freeUntil")}
                className="p-3 font-heading font-black text-xs uppercase cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-1">
                  AVAILABILITY WINDOW <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3 font-heading font-black text-xs uppercase">CURRENT / NEXT CLASS</th>
              <th className="p-3 font-heading font-black text-xs uppercase">AC / CAPACITY</th>
              <th className="p-3 font-heading font-black text-xs uppercase text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/10">
            {sortedRooms.map(({ room, status, freeUntil, busyUntil, freeMinutes, currentBooking, nextBooking }) => {
              return (
                <tr key={room.id} className="hover:bg-yellow-50/60 transition-colors">
                  <td className="p-3 font-black text-sm text-black">
                    <Link href={`/rooms/${room.id}`} className="hover:underline flex items-center gap-1">
                      {room.label || room.id}
                    </Link>
                  </td>
                  <td className="p-3 font-bold">
                    {room.floor !== null ? `Floor ${room.floor}` : "Unmapped"}
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 bg-gray-100 border border-black rounded-[2px] text-[10px] font-bold">
                      {room.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={clsx(
                        "px-2 py-0.5 font-bold uppercase rounded-[2px] border border-black shadow-[1px_1px_0px_#0A0A0A]",
                        status === "FREE" && "bg-[#6BCB77] text-black",
                        status === "FREE_SOON" && "bg-[#FFD93D] text-black",
                        status === "OCCUPIED" && "bg-[#FF3B30] text-white",
                        status === "DATA_CONFLICT" && "bg-[#B983FF] text-black",
                        status === "NO_CLASSES" && "bg-gray-200 text-gray-800"
                      )}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 font-bold">
                    {status === "FREE" && freeUntil ? `Free until ${freeUntil} (${freeMinutes}m)` : null}
                    {status === "FREE_SOON" && `Busy in ${freeMinutes}m (${freeUntil})`}
                    {status === "OCCUPIED" && busyUntil && `Busy until ${busyUntil}`}
                    {status === "DATA_CONFLICT" && "Overlapping Schedule"}
                    {status === "NO_CLASSES" && "All Day Free"}
                  </td>
                  <td className="p-3 font-sans">
                    {currentBooking ? (
                      <div>
                        <div className="font-bold text-xs">{currentBooking.subjectName || currentBooking.slot}</div>
                        <div className="font-mono text-[10px] text-gray-600">
                          {currentBooking.sectionLabel} (Slot {currentBooking.slot})
                        </div>
                      </div>
                    ) : nextBooking ? (
                      <div className="text-[11px] text-gray-600">
                        Next: {nextBooking.subjectName || nextBooking.slot} ({nextBooking.sectionLabel})
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {room.ac === true ? (
                        <NBBadge size="sm" variant="blue">AC</NBBadge>
                      ) : room.ac === false ? (
                        <NBBadge size="sm" variant="gray">NON-AC</NBBadge>
                      ) : (
                        <NBBadge size="sm" variant="yellow">AC ?</NBBadge>
                      )}
                      {room.capacity ? (
                        <NBBadge size="sm" variant="default">{room.capacity} seats</NBBadge>
                      ) : (
                        <NBBadge size="sm" variant="gray">SEATS ?</NBBadge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/rooms/${room.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-black rounded-[2px] shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#FFD93D] font-mono text-[10px] font-bold"
                    >
                      VIEW <ExternalLink size={10} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
