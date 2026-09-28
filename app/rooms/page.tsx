"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useFloorStore } from "@/lib/store";
import {
  getRoomStatus,
  buildBookings,
  RoomAvailabilityStatus,
} from "@/lib/engine";
import { useClockStore } from "@/lib/time/clockStore";
import { NBTabs } from "@/components/nb/NBTabs";
import { FloorSection } from "@/components/grid/FloorSection";
import { Timeline } from "@/components/grid/Timeline";
import { RoomList } from "@/components/grid/RoomList";
import { FinderBar } from "@/components/finder/FinderBar";
import { RoomPanel } from "@/components/rooms/RoomPanel";
import { ClaimModal } from "@/components/rooms/ClaimModal";
import { MapViewState, SquadClaimData } from "@/components/map3d/types";
import { RULES } from "@/config/rules";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import layoutSeed from "@/data/layout.json";
import { Section, Room } from "@/lib/schemas";
import {
  Box,
  LayoutGrid,
  CalendarDays,
  Sparkles,
  Layers,
  Flag,
} from "lucide-react";

// Dynamically import 3D Scene with ssr: false
const BuildingScene = dynamic(
  () => import("@/components/map3d/BuildingScene").then((m) => m.BuildingScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] bg-[#FFF8E7] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex flex-col items-center justify-center font-mono text-sm font-black space-y-2">
        <Box size={36} className="animate-spin text-[#FF6B9D]" />
        <span>INITIALIZING PROCEDURAL 3D BUILDING MODEL...</span>
      </div>
    ),
  }
);

const MapControlsOverlay = dynamic(
  () => import("@/components/map3d/MapControlsOverlay").then((m) => m.MapControlsOverlay),
  { ssr: false }
);

function RoomsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    selectedDate,
    selectedTime,
    isLiveNow,
    filters,
    strictReservation,
    enabledSections,
    rooms,
    overrides,
    setDate,
    setTime,
  } = useFloorStore();

  const { currentTimeShort } = useClockStore();

  // Active view tab: MAP | GRID | TIMELINE | FINDER
  const tabParam = searchParams.get("tab") || "map";
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  // 3D View State
  const [viewState, setViewState] = useState<MapViewState>({
    selectedRoomId: searchParams.get("focus") || null,
    hoveredRoomId: null,
    activeFloor: "ALL",
    isExploded: false,
    isCutaway: false,
    cameraMode: "orthographic",
    isPlayingTimeLapse: false,
    timeLapseSpeed: 1,
  });

  // Active squad claims
  const [claims, setClaims] = useState<Record<string, SquadClaimData>>({});
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [roomToClaim, setRoomToClaim] = useState<string | null>(null);

  // Fetch claims from /api/claims
  const fetchClaims = async () => {
    try {
      const res = await fetch("/api/claims");
      if (res.ok) {
        const data = await res.json();
        if (data.claims) setClaims(data.claims);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchClaims();
    const interval = setInterval(fetchClaims, 15000);
    return () => clearInterval(interval);
  }, []);

  // Construct current Date object
  const currentDateObj = useMemo(() => {
    try {
      return new Date(`${selectedDate}T${selectedTime}:00+05:30`);
    } catch {
      return new Date();
    }
  }, [selectedDate, selectedTime]);

  // Compute all bookings
  const currentBookings = useMemo(() => {
    const activeSecs = (sectionsData as unknown as Section[]).map((s) => ({
      ...s,
      enabled: enabledSections[s.id] ?? s.enabled,
    }));
    return buildBookings(activeSecs, { strictReservation });
  }, [enabledSections, strictReservation]);

  // Compute room status map
  const roomsStatusMap = useMemo(() => {
    const map: Record<string, RoomAvailabilityStatus> = {};
    for (const r of rooms) {
      map[r.id] = getRoomStatus(r.id, currentDateObj, {
        bookings: currentBookings,
        rooms,
        strictReservation,
        overrides,
      });
    }
    return map;
  }, [rooms, currentDateObj, currentBookings, strictReservation, overrides]);

  const allRoomsStatusList = useMemo(() => Object.values(roomsStatusMap), [roomsStatusMap]);

  // Group by floors for 2D Grid
  const floorGroups = useMemo(() => {
    const floors = [6, 5, 4, 3, 2, 1, 0];
    const groups: { floor: number | null; title: string; rooms: RoomAvailabilityStatus[] }[] = [];

    for (const f of floors) {
      const floorRooms = allRoomsStatusList.filter((r) => r.room.floor === f);
      const title = RULES.floorLabels[f] || `Floor ${f}`;
      groups.push({ floor: f, title, rooms: floorRooms });
    }

    const unmapped = allRoomsStatusList.filter((r) => r.room.floor === null);
    if (unmapped.length > 0) {
      groups.push({ floor: null, title: "Unmapped Rooms & Special Spaces", rooms: unmapped });
    }

    return groups;
  }, [allRoomsStatusList]);

  const handleClaimRoom = (roomId: string) => {
    setRoomToClaim(roomId);
    setIsClaimModalOpen(true);
  };

  const handleConfirmClaim = async (data: { squadSize: number; nickname: string }) => {
    if (!roomToClaim) return;
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomToClaim, ...data }),
      });
      if (res.ok) {
        await fetchClaims();
      }
    } catch (err) {
      console.warn("Claim failed:", err);
    }
  };

  const handleReleaseRoom = async (roomId: string) => {
    try {
      await fetch(`/api/claims?roomId=${encodeURIComponent(roomId)}`, { method: "DELETE" });
      await fetchClaims();
    } catch (err) {
      console.warn("Release failed:", err);
    }
  };

  const selectedStatusData = viewState.selectedRoomId
    ? roomsStatusMap[viewState.selectedRoomId]
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black">
            CAMPUS ROOMS & AVAILABILITY
          </h1>
          <p className="font-mono text-xs text-gray-700">
            Interactive 3D building model, live per-room countdowns, and Call the Squad.
          </p>
        </div>

        <NBTabs
          tabs={[
            { id: "map", label: "3D MAP", icon: <Box size={14} /> },
            { id: "grid", label: "2D GRID", icon: <LayoutGrid size={14} /> },
            { id: "timeline", label: "TIMELINE", icon: <CalendarDays size={14} /> },
            { id: "finder", label: "AI FINDER", icon: <Sparkles size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            router.push(`/rooms?tab=${tab}`, { scroll: false });
          }}
        />
      </div>

      {/* TAB 1: 3D INTERACTIVE MAP */}
      {activeTab === "map" && (
        <div className="relative">
          <BuildingScene
            layoutData={layoutSeed as any}
            roomsStatusMap={roomsStatusMap}
            claimsMap={claims}
            viewState={viewState}
            onSelectRoom={(rId) => setViewState((prev) => ({ ...prev, selectedRoomId: rId }))}
            onHoverRoom={(rId) => setViewState((prev) => ({ ...prev, hoveredRoomId: rId }))}
            onSelectFloor={(f) => setViewState((prev) => ({ ...prev, activeFloor: f }))}
            onDeselect={() => setViewState((prev) => ({ ...prev, selectedRoomId: null }))}
          />

          <MapControlsOverlay
            viewState={viewState}
            selectedTime={selectedTime}
            onTimeChange={(t) => setTime(t)}
            onResetTimeNow={() => setTime(currentTimeShort)}
            onUpdateViewState={(updates) => setViewState((prev) => ({ ...prev, ...updates }))}
          />

          {/* Floating Room Panel when room is selected */}
          {selectedStatusData && (
            <div className="absolute top-4 right-4 z-30">
              <RoomPanel
                statusData={selectedStatusData}
                claimData={claims[selectedStatusData.room.id]}
                onClose={() => setViewState((prev) => ({ ...prev, selectedRoomId: null }))}
                onClaimRoom={handleClaimRoom}
                onReleaseRoom={handleReleaseRoom}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 2D GRID */}
      {activeTab === "grid" && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
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

      {/* TAB 3: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="animate-in fade-in-50 duration-150">
          <Timeline
            roomsStatus={allRoomsStatusList}
            currentTime={selectedTime}
            allBookings={currentBookings}
            dayStr="MON"
          />
        </div>
      )}

      {/* TAB 4: AI FINDER */}
      {activeTab === "finder" && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          <div className="p-6 bg-[#FFF8E7] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A]">
            <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black mb-1">
              AI ROOM FINDER
            </h2>
            <p className="font-mono text-xs text-gray-700 mb-4">
              Enter queries in plain English like "Ground floor AC room for 2 hours".
            </p>
            <FinderBar onSearch={(q) => router.push(`/finder?q=${encodeURIComponent(q)}`)} />
          </div>
        </div>
      )}

      {/* Claim Room Modal */}
      {roomToClaim && (
        <ClaimModal
          isOpen={isClaimModalOpen}
          roomId={roomToClaim}
          roomLabel={roomsStatusMap[roomToClaim]?.room.label}
          onClose={() => {
            setIsClaimModalOpen(false);
            setRoomToClaim(null);
          }}
          onConfirmClaim={handleConfirmClaim}
        />
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono font-bold">LOADING ROOMS...</div>}>
      <RoomsPageContent />
    </Suspense>
  );
}
