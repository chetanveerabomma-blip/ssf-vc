export interface RoomPosition {
  roomId: string;
  label?: string;
  x: number; // center X
  z: number; // center Z
  w: number; // width along X
  d: number; // depth along Z
}

export interface CorridorSegment {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface BuildingElement {
  id: string;
  type: "STAIR" | "LIFT";
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface FloorLayout {
  floor: number | null; // 0 to 6, or null for unmapped annex
  label: string;
  width: number;
  depth: number;
  slabY: number; // base Y position
  rooms: RoomPosition[];
  corridors: CorridorSegment[];
  elements: BuildingElement[];
}

export interface BuildingLayoutData {
  floors: FloorLayout[];
}
