"use client";

import React, { useMemo } from "react";
import { Edges, Html } from "@react-three/drei";
import { LAYOUT_CONSTANTS } from "@/lib/layout/generator";
import { RoomPosition } from "@/lib/layout/types";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { SquadClaimData } from "./types";
import { Users, Lock, Flag, Clock } from "lucide-react";

interface RoomBlockProps {
  roomPos: RoomPosition;
  statusData?: RoomAvailabilityStatus;
  claimData?: SquadClaimData;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  isCutaway: boolean;
  pulseHighlight?: boolean;
  onSelect: (roomId: string) => void;
  onHover: (roomId: string | null) => void;
}

export const RoomBlock: React.FC<RoomBlockProps> = ({
  roomPos,
  statusData,
  claimData,
  isSelected,
  isHovered,
  isDimmed,
  isCutaway,
  pulseHighlight,
  onSelect,
  onHover,
}) => {
  const { roomId, label, x, z, w, d } = roomPos;
  const status = statusData?.status || "FREE";
  const isClaimed = Boolean(claimData);

  // Status Color Mapping (Neobrutalism Palette)
  const roomColor = useMemo(() => {
    if (isClaimed) return "#4D96FF"; // SQUAD INSIDE Blue
    switch (status) {
      case "FREE":
        return isDimmed ? "#9fe0a7" : "#6BCB77";
      case "FREE_SOON":
        return isDimmed ? "#ffe785" : "#FFD93D";
      case "OCCUPIED":
        return isDimmed ? "#ff8c85" : "#FF3B30";
      case "DATA_CONFLICT":
        return isDimmed ? "#d5b8ff" : "#B983FF";
      case "CLOSED":
        return isDimmed ? "#525252" : "#262626";
      case "NO_CLASSES":
      default:
        return isDimmed ? "#E5E7EB" : "#D1D5DB";
    }
  }, [status, isClaimed, isDimmed]);

  // Elevation lifting on hover and selection
  const liftY = isSelected ? 0.8 : isHovered ? 0.3 : 0;
  const currentHeight = isCutaway && z > 0 ? LAYOUT_CONSTANTS.ROOM_HEIGHT * 0.4 : LAYOUT_CONSTANTS.ROOM_HEIGHT;
  const posY = currentHeight / 2 + liftY;

  // Free time fill percentage (capped at 180 min)
  const freeMinutes = statusData?.freeMinutes || 0;
  const fillRatio = Math.min(1, Math.max(0, freeMinutes / 180));
  const fillHeight = currentHeight * fillRatio;

  return (
    <group position={[x, 0, z]}>
      {/* 1. Hard Offset Drop Slab (Neobrutalist 3D Shadow) */}
      <mesh
        position={[
          LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.x,
          LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.y,
          LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.z,
        ]}
      >
        <boxGeometry args={[w, 0.2, d]} />
        <meshBasicMaterial color="#0A0A0A" />
      </mesh>

      {/* 2. Main Room Geometry */}
      <mesh
        position={[0, posY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(roomId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(roomId);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <boxGeometry args={[w, currentHeight, d]} />
        <meshBasicMaterial color={roomColor} />
        {/* Thick black outline */}
        <Edges
          linewidth={isSelected ? 4 : 2.5}
          scale={1}
          threshold={15}
          color="#0A0A0A"
        />
      </mesh>

      {/* 3. Free-Time Fill Meter (Stepped side bar draining as countdown ticks) */}
      {status === "FREE" && freeMinutes > 0 && !isDimmed && (
        <mesh
          position={[w / 2 + 0.05, fillHeight / 2 + liftY, 0]}
        >
          <boxGeometry args={[0.1, fillHeight, Math.min(d * 0.6, 3.5)]} />
          <meshBasicMaterial color="#0A0A0A" />
        </mesh>
      )}

      {/* 4. Squad Flag if room is claimed */}
      {isClaimed && (
        <group position={[0, currentHeight + liftY, 0]}>
          {/* Flag Pole */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
            <meshBasicMaterial color="#0A0A0A" />
          </mesh>
          {/* Flag Banner */}
          <mesh position={[0.5, 1.2, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.05]} />
            <meshBasicMaterial color="#FF6B9D" />
            <Edges linewidth={2} color="#0A0A0A" />
          </mesh>
        </group>
      )}

      {/* 5. Neobrutalist Sticker Billboard Label */}
      <Html
        position={[0, currentHeight + liftY + (isClaimed ? 1.6 : 0.4), 0]}
        center
        distanceFactor={38}
        zIndexRange={[10, 0]}
        className="pointer-events-none select-none"
      >
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border-2 border-black font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A] whitespace-nowrap transition-all duration-150 ${
            isSelected
              ? "bg-[#FFD93D] text-black scale-110 ring-2 ring-black"
              : isHovered
              ? "bg-white text-black scale-105"
              : isClaimed
              ? "bg-[#4D96FF] text-white"
              : "bg-white text-black opacity-90"
          } ${pulseHighlight ? "animate-bounce" : ""}`}
        >
          {isClaimed ? (
            <span className="flex items-center gap-1 text-[10px]">
              <Flag size={11} className="text-yellow-300" />
              {label || roomId} ({claimData?.squadSize || 2}👥)
            </span>
          ) : (
            <span>{label || roomId}</span>
          )}

          {status === "CLOSED" && <Lock size={10} className="text-white" />}
          {status === "FREE_SOON" && <Clock size={10} className="text-amber-800" />}

          {/* Hover status hint */}
          {isHovered && !isClaimed && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded border border-black ${
                status === "FREE"
                  ? "bg-[#6BCB77] text-black"
                  : status === "FREE_SOON"
                  ? "bg-[#FFD93D] text-black"
                  : status === "OCCUPIED"
                  ? "bg-[#FF3B30] text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {status === "FREE" && freeMinutes > 0 ? `${freeMinutes}m` : status}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
