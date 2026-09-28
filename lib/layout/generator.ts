import { Room } from "@/lib/schemas";
import { FloorLayout, RoomPosition, BuildingLayoutData } from "./types";
import { RULES } from "@/config/rules";

export const LAYOUT_CONSTANTS = {
  FLOOR_HEIGHT: 4.2,
  ROOM_HEIGHT: 2.8,
  SLAB_THICKNESS: 0.4,
  BUILDING_WIDTH: 44,
  BUILDING_DEPTH: 22,
  CORRIDOR_WIDTH: 4,
  ROOM_DEPTH: 7.5,
  DROP_SHADOW_OFFSET: { x: 0.6, y: -0.15, z: 0.6 },
};

/**
 * Procedurally generates a double-loaded corridor layout for a floor
 */
export function generateFloorLayout(
  floor: number | null,
  roomsOnFloor: Room[],
  slabY: number
): FloorLayout {
  const isAnnex = floor === null;
  const label = isAnnex
    ? "Other / Unmapped Annex"
    : (RULES.floorLabels[floor] || `Floor ${floor}`);

  const sortedRooms = [...roomsOnFloor].sort((a, b) => a.id.localeCompare(b.id));
  const rooms: RoomPosition[] = [];

  if (isAnnex) {
    // Annex placement: compact 2x2 grid
    sortedRooms.forEach((r, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      rooms.push({
        roomId: r.id,
        label: r.label || r.id,
        x: (col === 0 ? -4 : 4),
        z: (row === 0 ? -4 : 4),
        w: 6.5,
        d: 6.5,
      });
    });

    return {
      floor: null,
      label,
      width: 18,
      depth: 18,
      slabY,
      rooms,
      corridors: [{ id: "annex-corridor", x: 0, z: 0, w: 2, d: 14 }],
      elements: [],
    };
  }

  // Standard Main Building Floor: Double-loaded corridor along X axis
  // North side: z = -6.0, South side: z = 6.0
  const roomWidth = 7.5;
  const roomDepth = LAYOUT_CONSTANTS.ROOM_DEPTH;
  const spacing = 1.0;

  // Split rooms into North and South wings
  const northRooms = sortedRooms.filter((_, idx) => idx % 2 === 0);
  const southRooms = sortedRooms.filter((_, idx) => idx % 2 === 1);

  // Position North rooms (z = -6.0)
  const totalNorthWidth = northRooms.length * (roomWidth + spacing);
  let startXNorth = -(totalNorthWidth / 2) + roomWidth / 2;
  northRooms.forEach((r) => {
    rooms.push({
      roomId: r.id,
      label: r.label || r.id,
      x: Math.round(startXNorth * 10) / 10,
      z: -6.0,
      w: roomWidth,
      d: roomDepth,
    });
    startXNorth += roomWidth + spacing;
  });

  // Position South rooms (z = 6.0)
  const totalSouthWidth = southRooms.length * (roomWidth + spacing);
  let startXSouth = -(totalSouthWidth / 2) + roomWidth / 2;
  southRooms.forEach((r) => {
    rooms.push({
      roomId: r.id,
      label: r.label || r.id,
      x: Math.round(startXSouth * 10) / 10,
      z: 6.0,
      w: roomWidth,
      d: roomDepth,
    });
    startXSouth += roomWidth + spacing;
  });

  const corridors = [
    {
      id: `corridor-${floor}`,
      x: 0,
      z: 0,
      w: LAYOUT_CONSTANTS.BUILDING_WIDTH - 6,
      d: LAYOUT_CONSTANTS.CORRIDOR_WIDTH,
    },
  ];

  const elements = [
    {
      id: `stair-${floor}-east`,
      type: "STAIR" as const,
      x: 18,
      z: 0,
      w: 4.5,
      d: 4.5,
    },
    {
      id: `lift-${floor}-west`,
      type: "LIFT" as const,
      x: -18,
      z: 0,
      w: 3.5,
      d: 3.5,
    },
  ];

  return {
    floor,
    label,
    width: LAYOUT_CONSTANTS.BUILDING_WIDTH,
    depth: LAYOUT_CONSTANTS.BUILDING_DEPTH,
    slabY,
    rooms,
    corridors,
    elements,
  };
}

/**
 * Generates the full multi-floor building layout dataset from room list
 */
export function generateBuildingLayout(allRooms: Room[]): BuildingLayoutData {
  const floors: FloorLayout[] = [];
  const standardFloors = [0, 1, 2, 3, 4, 5, 6];

  // 1. Generate stacked slabs for Floors 0 to 6
  for (const f of standardFloors) {
    const roomsOnFloor = allRooms.filter((r) => r.floor === f);
    const slabY = f * LAYOUT_CONSTANTS.FLOOR_HEIGHT;
    floors.push(generateFloorLayout(f, roomsOnFloor, slabY));
  }

  // 2. Generate Annex for unmapped rooms at ground level offset
  const unmappedRooms = allRooms.filter((r) => r.floor === null);
  if (unmappedRooms.length > 0) {
    floors.push(generateFloorLayout(null, unmappedRooms, 0));
  }

  return { floors };
}
