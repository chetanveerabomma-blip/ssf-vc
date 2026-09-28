"use client";

import React, { useMemo } from "react";
import { validateDataset } from "@/lib/engine";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBSticker } from "@/components/nb/NBSticker";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import {
  Database,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  Copy,
  Layers,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function DataAuditPage() {
  const report = useMemo(() => validateDataset(), []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Overview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <NBSticker color="purple" rotate="-1">
            SOURCE TRANSPARENCY
          </NBSticker>
          <NBBadge variant="default">100% OPEN ENGINE</NBBadge>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black">
          TIMETABLE DATA & INTEGRITY AUDIT
        </h1>
        <p className="font-sans text-sm text-gray-700">
          Full transparency on the source PDFs, section timetables, period timing models, and known
          data anomalies across SRM Trichy School of EEE.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <span className="font-mono text-[10px] text-gray-500 uppercase block font-bold">
            Sections Extracted
          </span>
          <span className="font-mono text-3xl font-black text-black">12 SECTIONS</span>
          <span className="font-mono text-[10px] text-gray-600 block mt-1">9 unique PDF docs</span>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <span className="font-mono text-[10px] text-gray-500 uppercase block font-bold">
            Rooms In Registry
          </span>
          <span className="font-mono text-3xl font-black text-[#4D96FF]">
            {report.totalRooms} ROOMS
          </span>
          <span className="font-mono text-[10px] text-gray-600 block mt-1">Floors 0 to 6</span>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <span className="font-mono text-[10px] text-gray-500 uppercase block font-bold">
            Active Conflicts
          </span>
          <span className="font-mono text-3xl font-black text-[#B983FF]">
            {report.conflicts.length} FLAGGED
          </span>
          <span className="font-mono text-[10px] text-gray-600 block mt-1">Across Year 1 & 2</span>
        </div>

        <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]">
          <span className="font-mono text-[10px] text-gray-500 uppercase block font-bold">
            Unmapped Rooms
          </span>
          <span className="font-mono text-3xl font-black text-[#FFD93D]">
            {report.unmappedRooms.length} ROOMS
          </span>
          <span className="font-mono text-[10px] text-gray-600 block mt-1">Che, Workshop, Yoga</span>
        </div>
      </div>

      {/* 1. DUPLICATE FILE AUDIT */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-3">
        <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
          <Copy size={20} className="text-[#FF6B9D]" />
          1. DUPLICATE PDF AUDIT
        </h2>
        <p className="font-sans text-xs text-gray-700">
          Only 9 of the 10 timetable PDFs provided are unique documents.
        </p>
        <div className="p-3 bg-[#FFF8E7] border-2 border-black rounded-[2px] font-mono text-xs">
          <strong>Identical Hash:</strong> <code>III_ECE_A.pdf</code> and{" "}
          <code>III_ECE_A (1).pdf</code> are byte-for-byte duplicates. The engine loads only one copy
          to prevent duplicate booking weight.
        </div>
      </div>

      {/* 2. THE YEAR 1 STALE DATA & IST-602 COLLISION */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
        <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
          <AlertTriangle size={20} className="text-[#B983FF]" />
          2. YEAR I DATA AUDIT & IST-602 COLLISION
        </h2>
        <div className="space-y-2 font-sans text-xs text-gray-800 leading-relaxed">
          <p>
            <strong>Observation:</strong> The Year I sheets (I ECE-A, I ECE-B & EEE, I ECE-DS, I Biotech-B) are
            labelled <strong>"2024-25"</strong>, mix "Even Semester" with "Odd Semester" headers, and
            use an entirely different period grid (P2 09:55-10:45 instead of 09:50-10:40).
          </p>
          <p>
            <strong>Direct Clash Detected:</strong> On Monday Period 1 (09:00 - 09:50), room{" "}
            <strong>IST-602</strong> is claimed by <strong>II BME (slot E)</strong> and also booked
            by <strong>I ECE-A (slot E)</strong>.
          </p>
        </div>

        <div className="p-3 bg-[#B983FF]/20 border-2 border-black rounded-[2px] font-mono text-xs space-y-1">
          <div className="font-black text-black">ENGINE TREATMENT:</div>
          <div>• Floor Manager detects this clash deterministically instead of hiding it.</div>
          <div>• Shows purple DATA CONFLICT status if Year I is toggled on.</div>
          <div>• Year I sections are disabled by default in production until verified by the department.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-black">
            <thead className="bg-gray-100 border-b border-black">
              <tr>
                <th className="p-2">ROOM</th>
                <th className="p-2">DAY</th>
                <th className="p-2">TIME INTERVAL</th>
                <th className="p-2">CONFLICTING SECTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20">
              {report.conflicts.slice(0, 5).map((c, i) => (
                <tr key={i} className="hover:bg-purple-50">
                  <td className="p-2 font-black">{c.roomId}</td>
                  <td className="p-2 font-bold">{c.day}</td>
                  <td className="p-2">
                    {Math.floor(c.startMin / 60)}:{(c.startMin % 60).toString().padStart(2, "0")} -{" "}
                    {Math.floor(c.endMin / 60)}:{(c.endMin % 60).toString().padStart(2, "0")}
                  </td>
                  <td className="p-2">
                    {c.bookings.map((b) => `${b.sectionLabel} (${b.slot})`).join(" vs ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MULTI-SECTION ROOM ALLOCATION (IST-625 CDC) */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-3">
        <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
          <Layers size={20} className="text-[#4D96FF]" />
          3. CDC ROOM (IST-625) & SLOTS AUDIT
        </h2>
        <p className="font-sans text-xs text-gray-700 leading-relaxed">
          Notations like <code>G-625</code>, <code>G-401</code>, <code>G-602</code>, and{" "}
          <code>H-TB-106</code> represent the CDC or elective slot + room name. Several sections
          utilize IST-625 for slot G, but across different non-overlapping periods (e.g. III ECE-A
          Mon P6-7, III ECE-DS Wed P8-9). The engine separates them cleanly.
        </p>
      </div>

      {/* 4. UNMAPPED ROOMS */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-3">
        <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
          <HelpCircle size={20} className="text-[#FFD93D]" />
          4. UNMAPPED ROOMS (FLOOR: NULL)
        </h2>
        <p className="font-sans text-xs text-gray-700">
          The Year I timetable includes generic room designations where no room number is given in
          the official document. These are kept in an UNMAPPED group:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {report.unmappedRooms.map((r) => (
            <div key={r.id} className="p-2.5 bg-gray-50 border-2 border-black rounded-[2px] font-mono text-xs">
              <div className="font-black text-black">{r.label}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">Type: {r.type}</div>
              <div className="text-[10px] text-gray-500 mt-1">Floor: Unassigned</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AC & CAPACITY COMPLETENESS */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-3">
        <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#6BCB77]" />
          5. AC & CAPACITY METADATA COMPLETENESS
        </h2>
        <p className="font-sans text-xs text-gray-700">
          Official timetables omit physical infrastructure metadata. To maintain strict integrity,
          the engine refuses to fabricate data:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 bg-yellow-50 border-2 border-black rounded-[2px] font-mono text-xs">
            <span className="font-black block">AC Status: 28 Rooms Unverified</span>
            <span className="text-[11px] text-gray-700">
              AI outputs "AC status not recorded" instead of guessing. Facilities admin can verify
              rooms in the Admin portal.
            </span>
          </div>

          <div className="p-3 bg-yellow-50 border-2 border-black rounded-[2px] font-mono text-xs">
            <span className="font-black block">Capacity: 28 Rooms Unrecorded</span>
            <span className="text-[11px] text-gray-700">
              Room Finder assumes ~5 people for "me and my team" and filters only when capacity is
              known.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
