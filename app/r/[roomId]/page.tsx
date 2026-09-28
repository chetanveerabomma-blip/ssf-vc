"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoomStatus, buildBookings } from "@/lib/engine";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import { Section, Room } from "@/lib/schemas";
import { useClockStore } from "@/lib/time/clockStore";
import { NBButton } from "@/components/nb/NBButton";
import { NBBadge } from "@/components/nb/NBBadge";
import {
  MapPin,
  Clock,
  Sparkles,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Send,
  Flag,
} from "lucide-react";

export default function SquadSharePage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = decodeURIComponent(resolvedParams.roomId);
  const searchParams = useSearchParams();
  const untilEpoch = searchParams.get("until") ? Number(searchParams.get("until")) : null;

  const router = useRouter();
  const { getCorrectedNow, currentTimeStr } = useClockStore();

  const [imComingCount, setImComingCount] = useState(0);
  const [hasClickedComing, setHasClickedComing] = useState(false);

  // Compute room status
  const now = getCorrectedNow();
  const allBookings = useMemo(() => buildBookings(sectionsData as unknown as Section[]), []);
  const roomStatus = useMemo(() => {
    return getRoomStatus(roomId, now, {
      bookings: allBookings,
      rooms: roomsData as unknown as Room[],
    });
  }, [roomId, now, allBookings]);

  // Expiration check: either based on untilEpoch or room status
  const isTimeExpired = untilEpoch ? Date.now() > untilEpoch : false;
  const isFreeNow = roomStatus.status === "FREE" && !isTimeExpired;

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (untilEpoch) return Math.max(0, Math.floor((untilEpoch - Date.now()) / 1000));
    return (roomStatus.freeMinutes || 0) * 60;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const timerFormatted = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const handleComingClick = () => {
    if (hasClickedComing) return;
    setHasClickedComing(true);
    setImComingCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] p-6 space-y-6">
        {/* Header sticker */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-black text-[#FFD93D] font-mono text-xs font-black uppercase rounded-[2px]">
              SQUAD INVITE
            </span>
            <span className="font-mono text-xs text-gray-600">
              {roomStatus.room.floor !== null ? `Floor ${roomStatus.room.floor}` : "Annex"}
            </span>
          </div>

          <Link href={`/rooms?focus=${roomId}`}>
            <span className="font-heading text-xs font-black uppercase text-black hover:underline flex items-center gap-1">
              OPEN IN 3D MAP <ArrowRight size={13} />
            </span>
          </Link>
        </div>

        {/* Room Headline */}
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl uppercase tracking-tight text-black">
            {roomStatus.room.label || roomId}
          </h1>
          <p className="font-mono text-xs text-gray-700 mt-1">
            {roomStatus.room.notes || `${roomStatus.room.type} Room`}
          </p>
        </div>

        {/* Status Card */}
        {isFreeNow ? (
          <div className="p-6 bg-[#6BCB77] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] text-center space-y-2">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-black opacity-90 block">
              FREE NOW • TIME REMAINING
            </span>
            <div className="font-mono text-5xl sm:text-6xl font-black text-black tracking-tight">
              {timerFormatted}
            </div>
            {roomStatus.freeUntil && (
              <span className="font-mono text-xs font-black text-black block">
                Free until {roomStatus.freeUntil} (SRM Trichy Campus)
              </span>
            )}
          </div>
        ) : (
          <div className="p-6 bg-[#FF3B30] text-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] text-center space-y-3">
            <AlertTriangle size={32} className="mx-auto" />
            <h2 className="font-heading font-black text-2xl uppercase tracking-wider">
              THIS ROOM IS NO LONGER FREE
            </h2>
            <p className="font-mono text-xs opacity-90">
              The free window for this room has ended or a class has commenced.
            </p>
            <div className="pt-2">
              <Link href="/rooms?tab=finder">
                <NBButton variant="secondary" size="md" className="w-full">
                  <Sparkles size={14} /> FIND ANOTHER FREE ROOM
                </NBButton>
              </Link>
            </div>
          </div>
        )}

        {/* Next Class info */}
        {isFreeNow && roomStatus.nextBooking && (
          <div className="p-3 bg-gray-50 border-2 border-black rounded-[2px] font-mono text-xs">
            <span className="font-bold text-gray-500 uppercase block text-[10px]">NEXT UP</span>
            <div className="font-black text-black">
              {roomStatus.nextBooking.subjectName || roomStatus.nextBooking.slot} ({roomStatus.nextBooking.sectionLabel})
            </div>
          </div>
        )}

        {/* Squad Presence & "I'M COMING" Button */}
        {isFreeNow && (
          <div className="pt-2 space-y-3">
            <button
              onClick={handleComingClick}
              disabled={hasClickedComing}
              className={`w-full py-3.5 px-4 font-heading text-sm font-black uppercase tracking-wider border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] transition-all flex items-center justify-center gap-2 ${
                hasClickedComing
                  ? "bg-[#FFD93D] text-black"
                  : "bg-[#4D96FF] text-white hover:bg-[#3b87f5] active:translate-x-1 active:translate-y-1 active:shadow-none"
              }`}
            >
              <CheckCircle size={16} />
              {hasClickedComing ? "YOU MARKED ATTENDANCE!" : "I'M COMING! 🏃"}
            </button>

            {imComingCount > 0 && (
              <p className="font-mono text-xs font-bold text-center text-gray-700">
                👥 {imComingCount} {imComingCount === 1 ? "person is" : "people are"} on the way!
              </p>
            )}

            <div className="pt-2 flex justify-center">
              <Link href={`/rooms?focus=${roomId}`}>
                <span className="font-mono text-xs font-bold text-gray-600 hover:text-black underline">
                  View room position on the 3D building map
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
