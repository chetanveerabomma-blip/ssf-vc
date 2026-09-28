"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFloorStore } from "@/lib/store";
import {
  getRoomStatus,
  buildBookings,
  RoomAvailabilityStatus,
  Booking,
} from "@/lib/engine";
import {
  formatIST,
  getISTNow,
  isHoliday,
  isSemesterActive,
  getDayOfWeekString,
  timeStringToMinutes,
  formatMinutesToTime,
} from "@/lib/time";
import { TimeScrubber } from "@/components/grid/TimeScrubber";
import { FloorSection } from "@/components/grid/FloorSection";
import { Timeline } from "@/components/grid/Timeline";
import { RoomList } from "@/components/grid/RoomList";
import { FinderBar } from "@/components/finder/FinderBar";
import { NBTabs } from "@/components/nb/NBTabs";
import { NBToggle } from "@/components/nb/NBToggle";
import { NBSlider } from "@/components/nb/NBSlider";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBButton } from "@/components/nb/NBButton";
import { RULES } from "@/config/rules";
import {
  LayoutGrid,
  CalendarDays,
  ListFilter,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  X,
  Sparkles,
  Lock,
} from "lucide-react";
import sectionsData from "@/data/sections.json";
import { Section } from "@/lib/schemas";

function GridPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    selectedDate,
    selectedTime,
    isLiveNow,
    activeView,
    filters,
    strictReservation,
    enabledSections,
    rooms,
    overrides,
    setDate,
    setTime,
    setLiveNow,
    setActiveView,
    setFilters,
    resetFilters,
  } = useFloorStore();

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Check URL parameters for override: ?at=2026-10-05T10:15 or ?floor=1&ac=true
  useEffect(() => {
    const atParam = searchParams.get("at");
    if (atParam) {
      if (atParam.includes("T")) {
        const [d, t] = atParam.split("T");
        if (d) setDate(d);
        if (t) setTime(t.slice(0, 5));
      } else if (atParam.includes(":")) {
        setTime(atParam.slice(0, 5));
      }
    }
    const floorParam = searchParams.get("floor");
    if (floorParam !== null && floorParam !== "") {
      setFilters({ floor: Number(floorParam) });
    }
    const acParam = searchParams.get("ac");
    if (acParam === "true") setFilters({ ac: "ac" });
    if (acParam === "false") setFilters({ ac: "non-ac" });
  }, [searchParams, setDate, setTime, setFilters]);

  // Construct reference Date object from selectedDate and selectedTime
  const currentDateObj = useMemo(() => {
    try {
      return new Date(`${selectedDate}T${selectedTime}:00+05:30`);
    } catch {
      return getISTNow();
    }
  }, [selectedDate, selectedTime]);

  const dateStr = selectedDate;
  const dayOfWeek = getDayOfWeekString(currentDateObj);
  const holiday = isHoliday(dateStr);
  const isWeekend = dayOfWeek === "SAT" || dayOfWeek === "SUN";
  const semesterActive = isSemesterActive(dateStr);

  // Active sections based on store's enabledSections
  const activeSectionsList = useMemo(() => {
    return (sectionsData as unknown as Section[]).map((sec) => ({
      ...sec,
      enabled: enabledSections[sec.id] ?? sec.enabled,
    }));
  }, [enabledSections]);

  // Precompute merged bookings for current settings
  const currentBookings = useMemo(() => {
    return buildBookings(activeSectionsList, { strictReservation });
  }, [activeSectionsList, strictReservation]);

  // Compute status for all rooms at this point in time
  const allRoomsStatus: RoomAvailabilityStatus[] = useMemo(() => {
    return rooms.map((room) =>
      getRoomStatus(room.id, currentDateObj, {
        bookings: currentBookings,
        rooms,
        strictReservation,
        overrides,
      })
    );
  }, [rooms, currentDateObj, currentBookings, strictReservation, overrides]);

  // Apply filters to room statuses
  const filteredRoomsStatus = useMemo(() => {
    return allRoomsStatus.filter((statusData) => {
      const { room, freeMinutes } = statusData;

      // Floor filter
      if (filters.floor !== null && room.floor !== filters.floor) {
        return false;
      }

      // Hide labs
      if (filters.hideLabs && room.type === "LAB") {
        return false;
      }

      // Room type
      if (filters.roomType && room.type !== filters.roomType) {
        return false;
      }

      // AC filter
      if (filters.ac === "ac" && room.ac === false) return false;
      if (filters.ac === "non-ac" && room.ac === true) return false;

      // Min capacity
      if (filters.minCapacity > 0) {
        if (room.capacity !== null && room.capacity < filters.minCapacity) {
          return false;
        }
      }

      // Free for at least N minutes
      if (filters.minFreeMinutes > 0) {
        if ((freeMinutes || 0) < filters.minFreeMinutes) {
          return false;
        }
      }

      return true;
    });
  }, [allRoomsStatus, filters]);

  // Group by floors: 6, 5, 4, 3, 2, 1, 0, and unmapped (null)
  const floorGroups = useMemo(() => {
    const floors = [6, 5, 4, 3, 2, 1, 0];
    const groups: { floor: number | null; title: string; rooms: RoomAvailabilityStatus[] }[] = [];

    for (const f of floors) {
      const floorRooms = filteredRoomsStatus.filter((r) => r.room.floor === f);
      const title = RULES.floorLabels[f] || `Floor ${f}`;
      groups.push({ floor: f, title, rooms: floorRooms });
    }

    // Unmapped floor
    const unmapped = filteredRoomsStatus.filter((r) => r.room.floor === null);
    if (unmapped.length > 0) {
      groups.push({ floor: null, title: "Unmapped Rooms & Special Spaces", rooms: unmapped });
    }

    return groups;
  }, [filteredRoomsStatus]);

  // Section 13 timetable overrides calculations for selected date
  const dayOrderToday = useMemo(() => {
    return overrides?.dayOrders?.find((d) => d.date === selectedDate);
  }, [overrides, selectedDate]);

  const cancellationsToday = useMemo(() => {
    return (overrides?.cancellations || []).filter((c) => c.date === selectedDate);
  }, [overrides, selectedDate]);

  const closuresToday = useMemo(() => {
    return (overrides?.roomClosures || []).filter((rc) => {
      const d = selectedDate;
      const f = rc.from.slice(0, 10);
      const t = rc.to.slice(0, 10);
      return d >= f && d <= t;
    });
  }, [overrides, selectedDate]);

  const totalOverridesToday =
    (dayOrderToday ? 1 : 0) + cancellationsToday.length + closuresToday.length;

  // Summary counts
  const freeNowCount = allRoomsStatus.filter((r) => r.status === "FREE").length;
  const freeSoonCount = allRoomsStatus.filter((r) => r.status === "FREE_SOON").length;
  const occupiedCount = allRoomsStatus.filter((r) => r.status === "OCCUPIED").length;
  const conflictCount = allRoomsStatus.filter((r) => r.status === "DATA_CONFLICT").length;
  const closedCount = allRoomsStatus.filter((r) => r.status === "CLOSED").length;

  const handleAiSearch = (queryText: string) => {
    router.push(`/finder?q=${encodeURIComponent(queryText)}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. BANNERS: Overrides / Semester / Weekend / Holiday / Data Completeness */}
      {totalOverridesToday > 0 && (
        <div className="p-3 bg-[#FFD93D] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-black text-black">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-black text-[#FFD93D] text-[10px] tracking-wider uppercase border border-black rounded-[2px]">
              OVERRIDE ACTIVE
            </span>
            <span>
              {totalOverridesToday} {totalOverridesToday === 1 ? "CHANGE" : "CHANGES"} TODAY:{" "}
              {dayOrderToday ? `FOLLOWING ${dayOrderToday.followsDay} ORDER · ` : ""}
              {cancellationsToday.length} CANCELLED · {closuresToday.length} CLOSED
            </span>
          </div>
          {dayOrderToday?.note && (
            <span className="text-[11px] font-sans font-bold bg-white/80 px-2 py-0.5 border border-black rounded">
              {dayOrderToday.note}
            </span>
          )}
        </div>
      )}

      {!semesterActive && (
        <div className="p-3 bg-[#FFD93D] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-2 font-mono text-xs font-black text-black">
          <AlertTriangle size={18} className="text-black flex-shrink-0" />
          <span>
            SEMESTER NOT RUNNING: Selected date is outside the 29 Aug - 29 Nov 2026 semester. Timetables may not apply.
          </span>
        </div>
      )}

      {!dayOrderToday && (isWeekend || holiday) && (
        <div className="p-3 bg-[#6BCB77] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-2 font-mono text-xs font-black text-black">
          <Info size={18} className="text-black flex-shrink-0" />
          <span>
            {holiday
              ? `PUBLIC HOLIDAY (${holiday.name.toUpperCase()}): NO CLASSES SCHEDULED. ALL ROOMS FREE.`
              : "WEEKEND: NO CLASSES SCHEDULED. ALL ROOMS FREE."}
          </span>
        </div>
      )}

      <div className="p-3 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-between gap-2 font-mono text-xs text-gray-800">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-black flex-shrink-0" />
          <span>
            <strong>DATA COMPLETENESS:</strong> AC status & capacities are unverified in published timetables. Mark verified in Admin.
          </span>
        </div>
        <span className="px-2 py-0.5 bg-[#FFF8E7] border border-black font-bold text-[10px]">
          v1.0 AUDIT
        </span>
      </div>

      {/* 2. TIME SCRUBBER & CONTROLS */}
      <TimeScrubber
        date={selectedDate}
        time={selectedTime}
        isLive={isLiveNow}
        onDateChange={setDate}
        onTimeChange={setTime}
        onToggleLive={setLiveNow}
      />

      {/* 3. STICKY / COMPACT AI FINDER BAR */}
      <div className="sticky top-20 z-30 bg-[#FFF8E7] p-3 border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-heading text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#FF6B9D]" />
            QUICK AI ROOM FINDER
          </span>
          <span className="font-mono text-[10px] text-gray-600 hidden sm:inline">
            Type natural requests like "Ground floor lab for 2 hours"
          </span>
        </div>
        <FinderBar onSearch={handleAiSearch} compact />
      </div>

      {/* 4. KPI STRIP & VIEW SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-[#6BCB77] border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A]">
            {freeNowCount} FREE
          </div>
          <div className="px-3 py-1.5 bg-[#FFD93D] border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A]">
            {freeSoonCount} FREE SOON
          </div>
          <div className="px-3 py-1.5 bg-[#FF3B30] text-white border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A]">
            {occupiedCount} OCCUPIED
          </div>
          {conflictCount > 0 && (
            <div className="px-3 py-1.5 bg-[#B983FF] border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1">
              <AlertTriangle size={14} /> {conflictCount} CONFLICTS
            </div>
          )}
          {closedCount > 0 && (
            <div className="px-3 py-1.5 bg-[#262626] text-white border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1">
              <Lock size={14} /> {closedCount} CLOSED
            </div>
          )}
        </div>

        {/* View Tabs & Filter Toggle Button */}
        <div className="flex items-center gap-3">
          <NBTabs
            activeTab={activeView}
            onChange={(tab) => setActiveView(tab as any)}
            tabs={[
              { id: "grid", label: "GRID", icon: <LayoutGrid size={14} /> },
              { id: "timeline", label: "TIMELINE", icon: <CalendarDays size={14} /> },
              { id: "list", label: "LIST", icon: <ListFilter size={14} /> },
            ]}
          />

          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border-[3px] border-black rounded-[4px] shadow-[3px_3px_0px_#0A0A0A] font-heading text-xs font-black uppercase hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5"
          >
            <SlidersHorizontal size={14} /> FILTERS
          </button>
        </div>
      </div>

      {/* 5. FILTER DRAWER / PANEL */}
      {filterDrawerOpen && (
        <div className="p-4 sm:p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h4 className="font-heading font-black text-sm uppercase">ROOM FILTERS & CRITERIA</h4>
            <button
              onClick={() => setFilterDrawerOpen(false)}
              className="p-1 hover:bg-gray-100 border border-black rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Floor filter */}
            <div>
              <label className="block font-heading text-xs font-black uppercase mb-1">
                Filter by Floor
              </label>
              <select
                value={filters.floor !== null ? filters.floor : "all"}
                onChange={(e) =>
                  setFilters({ floor: e.target.value === "all" ? null : Number(e.target.value) })
                }
                className="w-full p-2 font-mono text-xs border-2 border-black rounded bg-white shadow-[2px_2px_0px_#0A0A0A]"
              >
                <option value="all">All Floors (0 - 6)</option>
                <option value="0">Ground Floor (Floor 0)</option>
                <option value="1">First Floor (Floor 1)</option>
                <option value="2">Second Floor (Floor 2)</option>
                <option value="3">Third Floor (Floor 3)</option>
                <option value="4">Fourth Floor (Floor 4)</option>
                <option value="5">Fifth Floor (Floor 5)</option>
                <option value="6">Sixth Floor (Floor 6)</option>
              </select>
            </div>

            {/* AC Filter */}
            <div>
              <label className="block font-heading text-xs font-black uppercase mb-1">
                Air Conditioning
              </label>
              <select
                value={filters.ac}
                onChange={(e) => setFilters({ ac: e.target.value as any })}
                className="w-full p-2 font-mono text-xs border-2 border-black rounded bg-white shadow-[2px_2px_0px_#0A0A0A]"
              >
                <option value="all">Any Status</option>
                <option value="ac">AC Rooms Only</option>
                <option value="non-ac">Non-AC Rooms Only</option>
              </select>
            </div>

            {/* Room Type */}
            <div>
              <label className="block font-heading text-xs font-black uppercase mb-1">
                Room Type
              </label>
              <select
                value={filters.roomType || "all"}
                onChange={(e) =>
                  setFilters({ roomType: e.target.value === "all" ? null : e.target.value })
                }
                className="w-full p-2 font-mono text-xs border-2 border-black rounded bg-white shadow-[2px_2px_0px_#0A0A0A]"
              >
                <option value="all">All Types</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="LAB">Laboratory</option>
                <option value="CDC">CDC Hall</option>
                <option value="OTHER">Other Spaces</option>
              </select>
            </div>

            {/* Min Free Time Slider */}
            <div>
              <NBSlider
                label="Free for at least"
                min={0}
                max={180}
                step={15}
                value={filters.minFreeMinutes}
                onChange={(val) => setFilters({ minFreeMinutes: val })}
                displayValue={`${filters.minFreeMinutes} min`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <NBToggle
              label="Hide Laboratories"
              checked={filters.hideLabs}
              onChange={(checked) => setFilters({ hideLabs: checked })}
            />

            <button
              onClick={resetFilters}
              className="px-3 py-1 font-mono text-xs font-bold text-gray-700 hover:text-black underline"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* 6. MAIN VIEW CONTENT */}
      {activeView === "grid" && (
        <div className="space-y-6">
          {floorGroups.map((group) => (
            <FloorSection
              key={group.floor !== null ? group.floor : "unmapped"}
              floorNumber={group.floor}
              floorTitle={group.title}
              rooms={group.rooms}
            />
          ))}
        </div>
      )}

      {activeView === "timeline" && (
        <Timeline
          roomsStatus={filteredRoomsStatus}
          currentTime={selectedTime}
          allBookings={currentBookings}
          dayStr={dayOfWeek}
        />
      )}

      {activeView === "list" && <RoomList roomsStatus={filteredRoomsStatus} />}
    </div>
  );
}

export default function GridPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center font-mono text-sm font-bold">
          LOADING SRM TRICHY FLOOR GRID...
        </div>
      }
    >
      <GridPageContent />
    </Suspense>
  );
}
