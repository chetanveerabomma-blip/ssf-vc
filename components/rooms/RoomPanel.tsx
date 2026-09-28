"use client";

import React, { useState, useEffect } from "react";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { SquadClaimData } from "@/components/map3d/types";
import { useClockStore } from "@/lib/time/clockStore";
import { buildSquadMessage, getWhatsAppUrl } from "@/lib/squad/whatsapp";
import {
  X,
  Clock,
  Lock,
  Flag,
  Users,
  Snowflake,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Send,
} from "lucide-react";
import { NBButton } from "@/components/nb/NBButton";
import { NBBadge } from "@/components/nb/NBBadge";

interface RoomPanelProps {
  statusData: RoomAvailabilityStatus;
  claimData?: SquadClaimData;
  onClose: () => void;
  onClaimRoom: (roomId: string) => void;
  onReleaseRoom: (roomId: string) => void;
}

export const RoomPanel: React.FC<RoomPanelProps> = ({
  statusData,
  claimData,
  onClose,
  onClaimRoom,
  onReleaseRoom,
}) => {
  const {
    room,
    status,
    freeUntil,
    busyUntil,
    freeMinutes = 0,
    currentBooking,
    nextBooking,
    closureReason,
    isChangedToday,
    changeReason,
  } = statusData;

  const { currentTimeStr, currentEpochMs } = useClockStore();
  const [copied, setCopied] = useState(false);

  // Compute countdown in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, freeMinutes * 60);
  });

  useEffect(() => {
    setSecondsRemaining(Math.max(0, freeMinutes * 60));
  }, [freeMinutes]);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const hours = Math.floor(secondsRemaining / 3600);
  const mins = Math.floor((secondsRemaining % 3600) / 60);
  const secs = secondsRemaining % 60;
  const countdownFormatted = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isUrgentYellow = status === "FREE" && secondsRemaining <= 30 * 60 && secondsRemaining > 5 * 60;
  const isUrgentRed = status === "FREE" && secondsRemaining <= 5 * 60 && secondsRemaining > 0;
  const isExpired = status === "FREE" && secondsRemaining === 0 && freeUntil;

  // WhatsApp invite message
  const squadMsg = buildSquadMessage({
    roomId: room.id,
    roomLabel: room.label,
    floor: room.floor,
    freeUntil,
    isRestOfDay: !nextBooking && status === "FREE",
    untilEpoch: freeUntil ? currentEpochMs + secondsRemaining * 1000 : undefined,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(squadMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppUrl(squadMsg), "_blank");
  };

  return (
    <div className="w-full sm:w-[420px] bg-white border-[3px] border-black rounded-[4px] shadow-[8px_8px_0px_#0A0A0A] p-5 flex flex-col justify-between space-y-4 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                {room.label || room.id}
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#FFD93D] border border-black rounded-[2px]">
                {room.floor !== null ? `Floor ${room.floor}` : "Annex"}
              </span>
            </div>
            <p className="font-mono text-xs text-gray-600 mt-0.5">{room.notes || room.type}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 border-2 border-black rounded-[2px]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Override tag if changed today */}
        {isChangedToday && (
          <div className="mt-3 p-2 bg-[#FFD93D] border-2 border-black rounded-[2px] font-mono text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]">
            <AlertTriangle size={14} />
            <span>{changeReason || "Timetable changed today"}</span>
          </div>
        )}

        {/* Squad Inside Banner */}
        {claimData && (
          <div className="mt-3 p-2 bg-[#4D96FF] text-white border-2 border-black rounded-[2px] font-mono text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_#0A0A0A]">
            <span className="flex items-center gap-1.5">
              <Flag size={14} className="text-yellow-300" />
              SQUAD INSIDE ({claimData.squadSize} people • {claimData.nickname})
            </span>
            <button
              onClick={() => onReleaseRoom(room.id)}
              className="text-[10px] bg-white text-black px-2 py-0.5 rounded border border-black hover:bg-red-100"
            >
              RELEASE
            </button>
          </div>
        )}

        {/* Big Neobrutalist Countdown */}
        <div
          className={`mt-4 p-4 border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] text-center transition-all ${
            status === "CLOSED"
              ? "bg-[#262626] text-white"
              : isUrgentRed
              ? "bg-[#FF3B30] text-white animate-pulse"
              : isUrgentYellow
              ? "bg-[#FFD93D] text-black"
              : status === "FREE"
              ? "bg-[#6BCB77] text-black"
              : status === "OCCUPIED"
              ? "bg-[#FF3B30] text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          <div className="font-heading font-black text-xs uppercase tracking-wider mb-1 opacity-90">
            {status === "CLOSED"
              ? `ROOM CLOSED: ${closureReason || "MAINTENANCE"}`
              : !nextBooking && status === "FREE"
              ? "FREE FOR REST OF THE DAY"
              : status === "FREE"
              ? `NEXT CLASS STARTS IN`
              : status === "OCCUPIED"
              ? "FREE IN"
              : "STATUS"}
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight my-1">
            {status === "CLOSED" ? "LOCKED" : countdownFormatted}
          </div>

          {status === "FREE" && freeUntil && (
            <div className="font-mono text-xs font-bold mt-1 opacity-80">
              FREE UNTIL {freeUntil} (CLOSES 18:00)
            </div>
          )}
          {status === "OCCUPIED" && busyUntil && (
            <div className="font-mono text-xs font-bold mt-1 opacity-80">
              OCCUPIED UNTIL {busyUntil}
            </div>
          )}
        </div>

        {/* Class Details */}
        <div className="mt-4 space-y-2 font-mono text-xs">
          {currentBooking && (
            <div className="p-2.5 bg-gray-50 border-2 border-black rounded-[2px]">
              <span className="font-black text-[10px] text-red-600 uppercase block">CURRENT CLASS</span>
              <div className="font-bold text-sm text-black">{currentBooking.subjectName || currentBooking.slot}</div>
              <div className="text-gray-700">Section: {currentBooking.sectionLabel} (Slot {currentBooking.slot})</div>
            </div>
          )}

          {nextBooking && (
            <div className="p-2.5 bg-gray-50 border-2 border-black rounded-[2px]">
              <span className="font-black text-[10px] text-gray-600 uppercase block">NEXT CLASS</span>
              <div className="font-bold text-sm text-black">{nextBooking.subjectName || nextBooking.slot}</div>
              <div className="text-gray-700">Section: {nextBooking.sectionLabel} (Starts P{nextBooking.startPeriod})</div>
            </div>
          )}

          {/* Physical Metadata */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            {room.ac === true ? (
              <NBBadge variant="blue" size="sm"><Snowflake size={11} /> AC</NBBadge>
            ) : (
              <NBBadge variant="gray" size="sm">NON-AC</NBBadge>
            )}
            <NBBadge variant="default" size="sm"><Users size={11} /> {room.capacity || "—"} seats</NBBadge>
          </div>
        </div>
      </div>

      {/* Action Buttons: Call the Squad / Claim */}
      <div className="pt-3 border-t-2 border-black space-y-2">
        {status === "FREE" && freeMinutes >= 10 && !claimData && (
          <NBButton
            variant="yellow"
            size="md"
            className="w-full"
            onClick={() => onClaimRoom(room.id)}
          >
            <Flag size={15} /> CLAIM THIS ROOM
          </NBButton>
        )}

        {status === "FREE" && (
          <div className="space-y-2">
            <NBButton
              variant="green"
              size="md"
              className="w-full"
              onClick={handleOpenWhatsApp}
            >
              <Send size={15} /> CALL THE SQUAD (WHATSAPP)
            </NBButton>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-1.5 px-3 bg-white text-black font-heading text-xs font-bold uppercase border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A] hover:bg-gray-100 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? "COPIED!" : "COPY INVITE"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
