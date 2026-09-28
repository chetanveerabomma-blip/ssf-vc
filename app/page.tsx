"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NBButton } from "@/components/nb/NBButton";
import { NBCard } from "@/components/nb/NBCard";
import { NBSticker } from "@/components/nb/NBSticker";
import { NBBadge } from "@/components/nb/NBBadge";
import {
  Sparkles,
  ArrowRight,
  Clock,
  DoorOpen,
  Calendar,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Share2,
} from "lucide-react";
import { getISTNow, formatIST, getMinutesSinceMidnight, formatMinutesToTime } from "@/lib/time";
import { getRoomStatus, buildBookings } from "@/lib/engine";
import roomsData from "@/data/rooms.json";

export default function LandingPage() {
  const [currentTimeStr, setCurrentTimeStr] = useState("10:15");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live Stats calculation
  const [stats, setStats] = useState({
    freeNow: 16,
    occupiedNow: 12,
    currentPeriod: "P2 (09:50-10:40)",
    nextChangeIn: "18m 42s",
  });

  useEffect(() => {
    const updateStats = () => {
      const now = getISTNow();
      const currentMin = getMinutesSinceMidnight(now);
      setCurrentTimeStr(formatIST(now, "HH:mm"));

      let free = 0;
      let occ = 0;
      const allBookings = buildBookings();

      for (const r of roomsData) {
        const s = getRoomStatus(r.id, now, { bookings: allBookings });
        if (s.status === "FREE" || s.status === "FREE_SOON") {
          free++;
        } else {
          occ++;
        }
      }

      // Period name
      let pName = "Between Periods";
      if (currentMin >= 540 && currentMin < 590) pName = "P1 (09:00-09:50)";
      else if (currentMin >= 590 && currentMin < 640) pName = "P2 (09:50-10:40)";
      else if (currentMin >= 640 && currentMin < 650) pName = "TEA BREAK (10:40-10:50)";
      else if (currentMin >= 650 && currentMin < 700) pName = "P3 (10:50-11:40)";
      else if (currentMin >= 700 && currentMin < 750) pName = "P4 (11:40-12:30)";
      else if (currentMin >= 750 && currentMin < 800) pName = "LUNCH BREAK (12:30-13:20)";
      else if (currentMin >= 800 && currentMin < 850) pName = "P6 (13:20-14:10)";
      else if (currentMin >= 850 && currentMin < 900) pName = "P7 (14:10-15:00)";
      else if (currentMin >= 900 && currentMin < 910) pName = "TEA BREAK (15:00-15:10)";
      else if (currentMin >= 910 && currentMin < 960) pName = "P8 (15:10-16:00)";
      else if (currentMin >= 960 && currentMin < 1010) pName = "P9 (16:00-16:50)";
      else if (currentMin < 540) pName = "Pre-Campus (08:00-09:00)";
      else pName = "Post-Class (16:50-18:00)";

      setStats({
        freeNow: free,
        occupiedNow: occ,
        currentPeriod: pName,
        nextChangeIn: "14m 20s",
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    {
      q: "How accurate is the room availability?",
      a: "Floor Manager computes room occupancy with minute-level precision directly from the official 2026-27 SRM Trichy EEE department timetables. It accurately handles merged periods, lab shifts, split-day forenoon/afternoon rooms, and scheduled CDC slots.",
    },
    {
      q: "Are ad-hoc bookings or faculty meetings tracked?",
      a: "No. The system tracks published semester timetables. Ad-hoc department bookings, unscheduled guest lectures, or sudden room swaps made without updating the timetable are not reflected.",
    },
    {
      q: "Why is AC status and seating capacity marked 'Unverified'?",
      a: "The published section timetables only specify room numbers (e.g. IST 518, IST 225) without hardware inventory or room capacity figures. In v1, AC and capacity are defaulted to unverified until department facilities verify them in the Admin portal.",
    },
    {
      q: "Which semester and section timetables are loaded?",
      a: "12 sections across Year I, II, III, and IV are transcribed from official documents for the active semester (29 Aug - 29 Nov 2026). Year I provisional sheets with historical timing mismatches are isolated and can be audited in the Data page.",
    },
  ];

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <NBSticker color="yellow" rotate="-2">
                OFFICIAL SRM EEE
              </NBSticker>
              <NBSticker color="green" rotate="1">
                SEMESTER 2026
              </NBSticker>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-black leading-none">
              FIND AN EMPTY ROOM. <br />
              <span className="text-[#FF6B9D] underline decoration-black decoration-[6px] underline-offset-8">
                IN SECONDS.
              </span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-gray-800 font-medium max-w-xl">
              Live, floor-by-floor map of every room in SRM Trichy School of EEE.
              Know instantly which classrooms are free, how long they stay free, or ask the AI to find
              the perfect study room for your group.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/grid">
                <NBButton variant="green" size="lg" className="w-full sm:w-auto">
                  <DoorOpen size={20} /> OPEN FLOOR GRID
                </NBButton>
              </Link>
              <Link href="/finder">
                <NBButton variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Sparkles size={20} className="text-[#FF6B9D]" /> ASK THE AI
                </NBButton>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-700 pt-2">
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 size={16} className="text-green-600" /> 12 Sections Transcribed
              </span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 size={16} className="text-green-600" /> Floors 0 to 6
              </span>
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 size={16} className="text-green-600" /> 10-Minute Scrubber
              </span>
            </div>
          </div>

          {/* Right Column: Mock Interactive Grid Card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -top-4 -right-2 z-20">
              <NBSticker color="pink" rotate="3" className="text-sm py-1.5 px-4 animate-bounce">
                LIVE DEMO
              </NBSticker>
            </div>

            <div className="p-5 bg-white border-[4px] border-black rounded-[6px] shadow-[10px_10px_0px_#0A0A0A] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <span className="font-heading font-black text-sm uppercase">FLOOR 4 SNAPSHOT</span>
                  <p className="font-mono text-[10px] text-gray-600">Forenoon Period • 10:15 IST</p>
                </div>
                <span className="px-2 py-0.5 bg-[#FFD93D] border border-black font-mono text-xs font-black">
                  4 OF 5 FREE
                </span>
              </div>

              {/* 6 Mock Tiles */}
              <div className="grid grid-cols-2 gap-3">
                {/* Tile 1 */}
                <div className="p-3 bg-[#6BCB77] border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-lg">IST 411</span>
                    <span className="text-[9px] bg-black text-white font-mono px-1 rounded">FREE</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold mt-2">FREE UNTIL 13:20</div>
                  <div className="text-[9px] font-mono opacity-80 mt-1">185 MIN AVAILABLE</div>
                </div>

                {/* Tile 2 */}
                <div className="p-3 bg-[#FF3B30] text-white border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-lg">IST 518</span>
                    <span className="text-[9px] bg-white text-black font-mono px-1 rounded">OCCUPIED</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold mt-2">BUSY UNTIL 10:40</div>
                  <div className="text-[9px] font-mono opacity-90 truncate mt-1">III ECE-A (Slot B)</div>
                </div>

                {/* Tile 3 */}
                <div className="p-3 bg-[#FFD93D] border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-lg">IST 227</span>
                    <span className="text-[9px] bg-black text-white font-mono px-1 rounded">SOON</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold mt-2">OCCUPIED IN 5m</div>
                  <div className="text-[9px] font-mono opacity-80 mt-1">TEA BREAK (10:40-10:50)</div>
                </div>

                {/* Tile 4 */}
                <div className="p-3 bg-[#6BCB77] border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-lg">IST 225</span>
                    <span className="text-[9px] bg-black text-white font-mono px-1 rounded">FREE</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold mt-2">FREE UNTIL 10:50</div>
                  <div className="text-[9px] font-mono opacity-80 mt-1">P2 BLANK PERIOD</div>
                </div>

                {/* Tile 5 */}
                <div className="p-3 bg-[#B983FF] border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A] col-span-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-base">IST 602 (AUDIT FLAG)</span>
                    <span className="text-[9px] bg-black text-white font-mono px-1 rounded">CONFLICT</span>
                  </div>
                  <div className="font-mono text-[10px] font-bold mt-1 text-black">
                    I ECE-A (Y1) & II BME OVERLAP MON P1 • ENGINE FLAGS TRANSPARENTLY
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/grid"
                  className="font-heading text-xs font-black uppercase text-black hover:text-[#FF6B9D] inline-flex items-center gap-1"
                >
                  EXPLORE ALL FLOORS IN LIVE GRID <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATS STRIP */}
      <section className="bg-black text-white py-8 px-4 border-y-[4px] border-black">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 bg-[#1A1A1A] border-2 border-[#6BCB77] rounded-[2px] shadow-[4px_4px_0px_#6BCB77]">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">
              ROOMS FREE NOW
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-black text-[#6BCB77]">
              {stats.freeNow}
            </span>
          </div>

          <div className="p-4 bg-[#1A1A1A] border-2 border-[#FF3B30] rounded-[2px] shadow-[4px_4px_0px_#FF3B30]">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">
              ROOMS OCCUPIED
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-black text-[#FF3B30]">
              {stats.occupiedNow}
            </span>
          </div>

          <div className="p-4 bg-[#1A1A1A] border-2 border-[#FFD93D] rounded-[2px] shadow-[4px_4px_0px_#FFD93D]">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">
              CURRENT PERIOD
            </span>
            <span className="font-mono text-base sm:text-lg font-black text-[#FFD93D] block truncate mt-1">
              {stats.currentPeriod}
            </span>
          </div>

          <div className="p-4 bg-[#1A1A1A] border-2 border-[#4D96FF] rounded-[2px] shadow-[4px_4px_0px_#4D96FF]">
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest block">
              CAMPUS TIME (IST)
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-[#4D96FF] block mt-0.5">
              {currentTimeStr}
            </span>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM WE SOLVE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <NBSticker color="pink" rotate="-1">
            WHY THIS WAS BUILT
          </NBSticker>
          <h2 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black mt-3">
            STOP PLAYING CAMPUS ROULETTE
          </h2>
          <p className="font-sans text-sm text-gray-700 mt-2">
            Every day, students waste 20+ minutes roaming corridors trying to find an open room for
            group study, project prep, or quick discussions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NBCard variant="white" className="space-y-3">
            <div className="w-12 h-12 bg-[#FF3B30] text-white border-2 border-black rounded-[4px] flex items-center justify-center font-heading font-black text-xl shadow-[3px_3px_0px_#0A0A0A]">
              1
            </div>
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-black">
              WANDERING THE CORRIDORS
            </h3>
            <p className="font-sans text-xs text-gray-700 leading-relaxed">
              Climbing from the Ground floor to the 5th floor checking each door through the glass
              panel, only to find every single room occupied.
            </p>
          </NBCard>

          <NBCard variant="white" className="space-y-3">
            <div className="w-12 h-12 bg-[#FFD93D] text-black border-2 border-black rounded-[4px] flex items-center justify-center font-heading font-black text-xl shadow-[3px_3px_0px_#0A0A0A]">
              2
            </div>
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-black">
              KNOCKING ON OCCUPIED DOORS
            </h3>
            <p className="font-sans text-xs text-gray-700 leading-relaxed">
              Awkwardly opening doors mid-lecture or disturbing faculty because timetable sheets
              pinned near the entrance are outdated or torn.
            </p>
          </NBCard>

          <NBCard variant="white" className="space-y-3">
            <div className="w-12 h-12 bg-[#4D96FF] text-black border-2 border-black rounded-[4px] flex items-center justify-center font-heading font-black text-xl shadow-[3px_3px_0px_#0A0A0A]">
              3
            </div>
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-black">
              ZERO IDEA HOW LONG IT STAYS FREE
            </h3>
            <p className="font-sans text-xs text-gray-700 leading-relaxed">
              You settle down with your laptops, only for another section to arrive 7 minutes later
              for their next lecture. Floor Manager gives you exact free windows.
            </p>
          </NBCard>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-16 px-4 bg-[#FFF8E7] border-t-[3px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <NBSticker color="green" rotate="2">
              SIMPLE 3-STEP PROCESS
            </NBSticker>
            <h2 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black mt-3">
              HOW FLOOR MANAGER WORKS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
              <span className="font-mono text-4xl font-black text-[#FF6B9D]">01</span>
              <h3 className="font-heading font-black text-xl uppercase">PICK A DATE & TIME</h3>
              <p className="font-sans text-xs text-gray-700">
                Use the time scrubber to preview availability right now, during next period, or
                after lunch. Works for any day of the active semester.
              </p>
            </div>

            <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
              <span className="font-mono text-4xl font-black text-[#FFD93D]">02</span>
              <h3 className="font-heading font-black text-xl uppercase">SEE FREE ROOMS BY FLOOR</h3>
              <p className="font-sans text-xs text-gray-700">
                Browse every floor from Sixth down to Ground. Color codes tell you instantly: Green
                is free, Yellow is free soon, Red is occupied.
              </p>
            </div>

            <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
              <span className="font-mono text-4xl font-black text-[#6BCB77]">03</span>
              <h3 className="font-heading font-black text-xl uppercase">OR JUST ASK IN PLAIN ENGLISH</h3>
              <p className="font-sans text-xs text-gray-700">
                Type natural queries like "AC room on ground floor for 5 people for 2 hours". Our
                AI parser matches the exact free windows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI DEMO BLOCK */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-[#FF6B9D]" />
                <h3 className="font-heading font-black text-2xl uppercase tracking-wider">
                  AI ROOM FINDER PREVIEW
                </h3>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-1">
                The smart search bar translates natural language into exact timetable queries.
              </p>
            </div>
            <Link href="/finder">
              <NBButton variant="pink" size="sm">
                TRY THE FULL AI FINDER
              </NBButton>
            </Link>
          </div>

          {/* Fake Interactive Search Input */}
          <div className="p-4 bg-[#FFF8E7] border-2 border-black rounded-[4px]">
            <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-gray-900 border-b-2 border-black pb-2">
              <Search size={18} className="text-[#FF6B9D]" />
              <span className="text-black">
                "I need an AC room on the ground floor for me and my team for the next 2 hours"
              </span>
            </div>

            {/* Fake Result Cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-white border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xl font-black">IST 107</span>
                  <NBBadge variant="green" size="sm">
                    FULL MATCH
                  </NBBadge>
                </div>
                <div className="font-mono text-xs font-bold text-[#2e7d32] mt-1">
                  FREE 10:15 → 13:20 (185 MIN)
                </div>
                <div className="font-sans text-[11px] text-gray-700 mt-1">
                  Ground floor, covers your full 2 hours. AC status unverified.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xl font-black">TB 106</span>
                  <NBBadge variant="green" size="sm">
                    FULL MATCH
                  </NBBadge>
                </div>
                <div className="font-mono text-xs font-bold text-[#2e7d32] mt-1">
                  FREE 10:15 → 13:20 (185 MIN)
                </div>
                <div className="font-sans text-[11px] text-gray-700 mt-1">
                  Ground floor CDC Hall, free until lunch. Capacity ~40.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURE GRID (6 Cards) */}
      <section className="py-16 px-4 bg-[#FFF8E7] border-t-[3px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <NBSticker color="blue" rotate="-1">
              ENGINEERED FEATURES
            </NBSticker>
            <h2 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black mt-3">
              BUILT FOR SRM TRICHY EEE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NBCard variant="white">
              <Layers size={24} className="text-[#4D96FF] mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">FLOOR-BY-FLOOR VIEW</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Visual cards grouped by building floor (Sixth to Ground). Shows live free counters
                per floor.
              </p>
            </NBCard>

            <NBCard variant="white">
              <Clock size={24} className="text-[#FF6B9D] mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">GANTT TIMELINE VIEW</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Full-day schedule from 08:00 to 18:00 with red class spans, hatched lunch/tea breaks,
                and scrubbed time line.
              </p>
            </NBCard>

            <NBCard variant="white">
              <Sparkles size={24} className="text-[#FFD93D] mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">AI TEXT SEARCH</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Deterministic time resolution paired with Claude model extraction and instant regex
                fallback.
              </p>
            </NBCard>

            <NBCard variant="white">
              <Clock size={24} className="text-[#6BCB77] mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">FREE-UNTIL COUNTDOWNS</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Know not just that a room is free, but whether it stays free for 15 minutes or 3
                hours.
              </p>
            </NBCard>

            <NBCard variant="white">
              <AlertTriangle size={24} className="text-[#B983FF] mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">CONFLICT DETECTION</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Flags overlapping section bookings (such as Year I vs Year II collisions) with striped
                purple badges.
              </p>
            </NBCard>

            <NBCard variant="white">
              <Share2 size={24} className="text-black mb-2" />
              <h3 className="font-heading font-black text-lg uppercase">DEEP SHARING LINKS</h3>
              <p className="font-sans text-xs text-gray-700 mt-1">
                Share direct URLs with timestamp and filters like <code>/grid?floor=1&at=10:15</code>{" "}
                with your classmates.
              </p>
            </NBCard>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <NBSticker color="yellow" rotate="1">
            FREQUENTLY ASKED QUESTIONS
          </NBSticker>
          <h2 className="font-heading font-black text-3xl uppercase tracking-wider text-black mt-3">
            EVERYTHING YOU NEED TO KNOW
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-heading font-black text-base uppercase hover:bg-yellow-50/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-1 font-sans text-xs text-gray-700 border-t-2 border-black/10 bg-[#FFFDF7] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION */}
      <section className="py-16 px-4 bg-[#FF6B9D] border-t-[4px] border-black text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-tight text-black">
            READY TO FIND YOUR ROOM?
          </h2>
          <p className="font-mono text-sm text-black max-w-md mx-auto">
            Access the full floor grid or ask the AI assistant. Built for SRM Trichy School of EEE.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/grid">
              <NBButton variant="secondary" size="lg">
                OPEN FLOOR GRID NOW
              </NBButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
