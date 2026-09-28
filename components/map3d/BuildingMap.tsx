"use client";

import React, { useMemo } from "react";
import { BuildingLayoutData } from "@/lib/layout/types";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { SquadClaimData, MapViewState } from "./types";
import { FloorSlab } from "./FloorSlab";
import { RoomBlock } from "./RoomBlock";
import { LAYOUT_CONSTANTS } from "@/lib/layout/generator";

interface BuildingMapProps {
  layoutData: BuildingLayoutData;
  roomsStatusMap: Record<string, RoomAvailabilityStatus>;
  claimsMap: Record<string, SquadClaimData>;
  viewState: MapViewState;
  pulseRoomIds?: string[];
  onSelectRoom: (roomId: string) => void;
  onHoverRoom: (roomId: string | null) => void;
  onSelectFloor: (floor: number | null | "ALL") => void;
}

export const BuildingMap: React.FC<BuildingMapProps> = ({
  layoutData,
  roomsStatusMap,
  claimsMap,
  viewState,
  pulseRoomIds = [],
  onSelectRoom,
  onHoverRoom,
  onSelectFloor,
}) => {
  const {
    selectedRoomId,
    hoveredRoomId,
    activeFloor,
    isExploded,
    isCutaway,
  } = viewState;

  // Selected room's floor (for dimming logic)
  const selectedRoomFloor = useMemo(() => {
    if (!selectedRoomId) return null;
    const st = roomsStatusMap[selectedRoomId];
    return st?.room.floor ?? null;
  }, [selectedRoomId, roomsStatusMap]);

  return (
    <group position={[0, 0, 0]}>
      {layoutData.floors.map((floorLayout) => {
        const floorNum = floorLayout.floor;
        const isIsolated = activeFloor !== "ALL" && activeFloor === floorNum;
        const isHidden = activeFloor !== "ALL" && activeFloor !== floorNum;

        if (isHidden) return null;

        // Vertical spacing: exploded expands vertical gap by 2.2x
        const explodeMultiplier = isExploded ? 2.2 : 1.0;
        const baseFloorY = floorNum !== null
          ? floorNum * LAYOUT_CONSTANTS.FLOOR_HEIGHT * explodeMultiplier
          : 0;

        return (
          <group
            key={floorNum !== null ? `floor-${floorNum}` : "floor-annex"}
            position={[0, baseFloorY, 0]}
          >
            {/* 1. Floor Slab Base */}
            <FloorSlab
              layout={floorLayout}
              isIsolated={isIsolated}
              isCutaway={isCutaway}
              onSelectFloor={(f) => onSelectFloor(f === activeFloor ? "ALL" : f)}
            />

            {/* 2. Room Blocks on this Floor */}
            {floorLayout.rooms.map((roomPos) => {
              const rId = roomPos.roomId;
              const statusData = roomsStatusMap[rId];
              const claimData = claimsMap[rId];
              const isSelected = selectedRoomId === rId;
              const isHovered = hoveredRoomId === rId;
              const isDimmed =
                Boolean(selectedRoomId) &&
                selectedRoomFloor === floorNum &&
                !isSelected;
              const shouldPulse = pulseRoomIds.includes(rId);

              // Position offset for Annex
              const posX = floorNum === null ? 34 + roomPos.x : roomPos.x;

              return (
                <RoomBlock
                  key={rId}
                  roomPos={{ ...roomPos, x: posX }}
                  statusData={statusData}
                  claimData={claimData}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  isCutaway={isCutaway}
                  pulseHighlight={shouldPulse}
                  onSelect={onSelectRoom}
                  onHover={onHoverRoom}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
};
