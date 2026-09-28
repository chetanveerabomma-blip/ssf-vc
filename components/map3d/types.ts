import { RoomAvailabilityStatus } from "@/lib/engine";
import { RoomPosition, FloorLayout } from "@/lib/layout/types";

export interface SquadClaimData {
  roomId: string;
  squadSize: number;
  nickname: string;
  claimedAt: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface MapViewState {
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
  activeFloor: number | null | "ALL"; // specific floor or ALL
  isExploded: boolean;
  isCutaway: boolean;
  cameraMode: "orthographic" | "perspective";
  isPlayingTimeLapse: boolean;
  timeLapseSpeed: number; // 1x, 2x, 5x
}
