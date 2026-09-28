"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useClockStore } from "@/lib/time/clockStore";
import { getRoomStatus, buildBookings } from "@/lib/engine";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import { Section, Room } from "@/lib/schemas";
import {
  Box,
  Calculator,
  Sparkles,
  Send,
  Flag,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { NBButton } from "@/components/nb/NBButton";
import { NBBadge } from "@/components/nb/NBBadge";

export default function UnifiedLandingPage() {
  const { getCorrectedNow, currentTimeStr, currentDateStr } = useClockStore();

  const now = getCorrectedNow();
  const allBookings = useMemo(() => buildBookings(sectionsData as unknown as Section[]), []);
  const rooms = roomsData as unknown as Room[];

  // Quick stats
  const allStatuses = useMemo(() => {
    return rooms.map((r) =>
      getRoomStatus(r.id, now, { bookings: allBookings, rooms })
    );
  }, [rooms, now, allBookings]);

  const freeCount = allStatuses.filter((s) => s.status === "FREE").length;
  const freeSoonCount = allStatuses.filter((s) => s.status === "FREE_SOON").length;
  const occupiedCount = allStatuses.filter((s) => s.status === "OCCUPIED").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Hero Section */}
      <div className="p-8 sm:p-14 bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-[#FFD93D] border-2 border-black font-mono text-xs font-black uppercase rounded-[2px] shadow-[2px_2px_0px_#0A0A0A]">
            UNIFIED PLATFORM
          </span>
          <span className="px-3 py-1 bg-black text-white font-mono text-xs font-bold rounded-[2px]">
            SRM TRICHY • SCHOOL OF EEE
          </span>
          <span className="font-mono text-xs font-bold text-gray-500">
            {currentDateStr} • {currentTimeStr} IST
          </span>
        </div>

        <h1 className="font-heading font-black text-5xl sm:text-7xl uppercase tracking-tight text-black leading-none">
          YOUR CAMPUS, <br />
          <span className="text-[#FF6B9D] underline decoration-black decoration-wavy decoration-2">
            SORTED.
          </span>
        </h1>

        <p className="font-sans text-base sm:text-lg text-gray-800 max-w-2xl font-medium">
          Deterministic room availability, 3D interactive building map, live countdowns, WhatsApp squad invites, and precision 75% attendance leave forecasting.
        </p>

        {/* Two Major Entry Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Entry 1: Rooms & 3D Map */}
          <Link href="/rooms" className="group">
            <div className="p-6 bg-[#6BCB77] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0px_#0A0A0A] transition-all flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white border-2 border-black rounded-[2px] flex items-center justify-center text-black">
                    <Box size={20} />
                  </div>
                  <span className="font-mono text-xs font-black bg-black text-[#6BCB77] px-2 py-0.5 rounded">
                    {freeCount} FREE NOW
                  </span>
                </div>
                <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-black">
                  FLOOR MANAGER & 3D MAP
                </h2>
                <p className="font-mono text-xs text-black/90 mt-1">
                  Procedural 3D building model, per-room countdowns, explode & cutaway views, and Call the Squad.
                </p>
              </div>

              <div className="flex items-center gap-1 font-heading text-xs font-black uppercase text-black pt-2 border-t border-black/20">
                <span>LAUNCH 3D MAP & GRID</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Entry 2: Attendance Predictor */}
          <Link href="/dashboard" className="group">
            <div className="p-6 bg-[#FF6B9D] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0px_#0A0A0A] transition-all flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white border-2 border-black rounded-[2px] flex items-center justify-center text-black">
                    <Calculator size={20} />
                  </div>
                  <span className="font-mono text-xs font-black bg-black text-[#FF6B9D] px-2 py-0.5 rounded">
                    75% THRESHOLD
                  </span>
                </div>
                <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-black">
                  ATTENDANCE PREDICTOR
                </h2>
                <p className="font-mono text-xs text-black/90 mt-1">
                  Official SRM policy margin calculator, leave simulator (OD, Medical, Absent), and recovery roadmaps.
                </p>
              </div>

              <div className="flex items-center gap-1 font-heading text-xs font-black uppercase text-black pt-2 border-t border-black/20">
                <span>OPEN ATTENDANCE DASHBOARD</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Live Campus Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <div className="font-heading font-black text-xs text-gray-500 uppercase">FREE ROOMS</div>
          <div className="font-mono text-3xl font-black text-[#6BCB77] mt-1">{freeCount}</div>
          <div className="font-mono text-[10px] text-gray-600 mt-0.5">Vacant right now</div>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <div className="font-heading font-black text-xs text-gray-500 uppercase">FREE SOON</div>
          <div className="font-mono text-3xl font-black text-[#FFD93D] mt-1">{freeSoonCount}</div>
          <div className="font-mono text-[10px] text-gray-600 mt-0.5">Ending in &lt;15m</div>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <div className="font-heading font-black text-xs text-gray-500 uppercase">OCCUPIED</div>
          <div className="font-mono text-3xl font-black text-[#FF3B30] mt-1">{occupiedCount}</div>
          <div className="font-mono text-[10px] text-gray-600 mt-0.5">Classes in session</div>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <div className="font-heading font-black text-xs text-gray-500 uppercase">SECTIONS TRACKED</div>
          <div className="font-mono text-3xl font-black text-black mt-1">12</div>
          <div className="font-mono text-[10px] text-gray-600 mt-0.5">ECE, ECE-DS, BME</div>
        </div>
      </div>

      {/* 3. Feature Showcase Grid */}
      <div className="space-y-6">
        <h2 className="font-heading font-black text-3xl uppercase tracking-wider text-black border-b-2 border-black pb-2">
          INTEGRATED CAPABILITIES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-[#4D96FF] text-white border-2 border-black rounded flex items-center justify-center font-black">
              <Box size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              3D Procedural Building
            </h3>
            <p className="text-gray-700">
              Stackable floor slabs, corridor navigation, explode and cutaway controls, and live status coloring.
            </p>
          </div>

          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-[#FFD93D] text-black border-2 border-black rounded flex items-center justify-center font-black">
              <Clock size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              Per-Room Countdowns
            </h3>
            <p className="text-gray-700">
              Atomic server-synced countdowns with urgency alerts (&le;30m yellow, &le;5m red) and zero-refresh flips.
            </p>
          </div>

          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-[#6BCB77] text-black border-2 border-black rounded flex items-center justify-center font-black">
              <Send size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              Call the Squad (WhatsApp)
            </h3>
            <p className="text-gray-700">
              Claim rooms with Redis TTL, place 3D squad flags, and send pre-filled WhatsApp invites in one tap.
            </p>
          </div>

          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-[#FF6B9D] text-black border-2 border-black rounded flex items-center justify-center font-black">
              <Calculator size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              Leave & Margin Simulator
            </h3>
            <p className="text-gray-700">
              Simulate OD, Medical, and Absent days with exact period breakdown and irreversible detention warnings.
            </p>
          </div>

          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-[#B983FF] text-black border-2 border-black rounded flex items-center justify-center font-black">
              <Sparkles size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              Dual-Domain Assistant (⌘K)
            </h3>
            <p className="text-gray-700">
              Intelligent command bar routing between attendance advice and room search without hallucinated math.
            </p>
          </div>

          <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-2">
            <div className="w-8 h-8 bg-black text-white border-2 border-black rounded flex items-center justify-center font-black">
              <ShieldAlert size={16} />
            </div>
            <h3 className="font-heading font-black text-base uppercase text-black">
              Audits & Section 13 Overrides
            </h3>
            <p className="text-gray-700">
              Transparent timetable audits, Saturday working day orders, faculty leave cancellations, and room closures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
