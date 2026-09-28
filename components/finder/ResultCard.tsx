"use client";

import React, { useState } from "react";
import { RoomMatch } from "@/lib/engine";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBButton } from "@/components/nb/NBButton";
import Link from "next/link";
import { Copy, Check, ExternalLink, Snowflake, Users, MapPin } from "lucide-react";
import { clsx } from "clsx";

export interface ResultCardProps {
  match: RoomMatch;
  isPartial?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ match, isPartial = false }) => {
  const [copied, setCopied] = useState(false);
  const { room, window, minutesAvailable, requestedMinutes, why, acUnverified } = match;

  const handleCopy = () => {
    const text = `Room: ${room.label || room.id} (Floor ${room.floor ?? "Unmapped"})\nFree: ${window.startTime} - ${window.endTime} (${minutesAvailable} min)\n${why}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={clsx(
        "p-4 sm:p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A]",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#0A0A0A] transition-all flex flex-col justify-between gap-4"
      )}
    >
      <div>
        {/* Header: Room Name, Floor Sticker, Match status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black text-black">
                {room.label || room.id}
              </span>
              <span className="px-2 py-0.5 bg-[#FFD93D] font-mono text-xs font-black uppercase border-2 border-black rounded-[2px] shadow-[1px_1px_0px_#0A0A0A]">
                {room.floor !== null ? `FLOOR ${room.floor}` : "UNMAPPED"}
              </span>
            </div>
            <span className="font-mono text-xs text-gray-600 block mt-0.5">
              {room.notes || `Type: ${room.type}`}
            </span>
          </div>

          <span
            className={clsx(
              "px-2.5 py-1 font-mono text-xs font-black uppercase rounded-[2px] border-2 border-black shadow-[2px_2px_0px_#0A0A0A]",
              isPartial ? "bg-[#FFD93D] text-black" : "bg-[#6BCB77] text-black"
            )}
          >
            {isPartial ? "PARTIAL MATCH" : "FULL MATCH"}
          </span>
        </div>

        {/* Free Window Highlight Strip */}
        <div
          className={clsx(
            "p-3 rounded-[2px] border-2 border-black mb-3 shadow-[2px_2px_0px_#0A0A0A]",
            isPartial ? "bg-[#FFF8E7]" : "bg-[#6BCB77]/20"
          )}
        >
          <div className="flex items-center justify-between font-mono">
            <span className="text-xs font-black uppercase tracking-wider text-black">
              FREE WINDOW:
            </span>
            <span className="text-xs font-black bg-black text-[#FFD93D] px-2 py-0.5 rounded-[2px]">
              {minutesAvailable} MIN AVAILABLE
            </span>
          </div>
          <div className="font-mono text-lg font-black text-black mt-1">
            {window.startTime} → {window.endTime}
          </div>
          {isPartial && (
            <div className="font-mono text-[11px] text-red-600 font-bold mt-0.5">
              (Requested {requestedMinutes} min • Short by {requestedMinutes - minutesAvailable} min)
            </div>
          )}
        </div>

        {/* Badges: AC, Capacity, Type */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {room.ac === true ? (
            <NBBadge variant="blue" size="sm">
              <Snowflake size={12} /> AC VERIFIED
            </NBBadge>
          ) : room.ac === false ? (
            <NBBadge variant="gray" size="sm">
              NON-AC
            </NBBadge>
          ) : (
            <NBBadge variant="yellow" size="sm">
              AC STATUS UNVERIFIED
            </NBBadge>
          )}

          {room.capacity ? (
            <NBBadge variant="default" size="sm">
              <Users size={12} /> {room.capacity} SEATS
            </NBBadge>
          ) : (
            <NBBadge variant="gray" size="sm">
              SEATING CAPACITY UNRECORDED
            </NBBadge>
          )}

          <NBBadge variant="default" size="sm">
            {room.type}
          </NBBadge>
        </div>

        {/* Why this matches */}
        <div className="p-2.5 bg-gray-50 border-2 border-black rounded-[2px] font-sans text-xs">
          <strong className="font-mono uppercase text-[10px] text-gray-500 block">
            Why this matches:
          </strong>
          <span className="font-bold text-gray-900">{why}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-black/10">
        <Link href={`/grid?floor=${room.floor ?? ""}&at=${window.startTime}`} className="flex-1">
          <NBButton variant="yellow" size="sm" className="w-full">
            <MapPin size={14} /> SHOW ON GRID
          </NBButton>
        </Link>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-white border-2 border-black rounded-[2px] font-heading text-xs font-black uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-gray-100 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" /> COPIED!
            </>
          ) : (
            <>
              <Copy size={14} /> COPY
            </>
          )}
        </button>
        <Link href={`/rooms/${room.id}`}>
          <button className="px-3 py-1.5 bg-white border-2 border-black rounded-[2px] font-heading text-xs font-black uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-gray-100 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5">
            <ExternalLink size={14} /> DETAILS
          </button>
        </Link>
      </div>
    </div>
  );
};
