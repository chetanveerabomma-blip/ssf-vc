"use client";

import React from "react";
import { Edges, Html } from "@react-three/drei";
import { LAYOUT_CONSTANTS } from "@/lib/layout/generator";
import { FloorLayout } from "@/lib/layout/types";

interface FloorSlabProps {
  layout: FloorLayout;
  isIsolated: boolean;
  isCutaway: boolean;
  onSelectFloor: (floor: number | null) => void;
}

export const FloorSlab: React.FC<FloorSlabProps> = ({
  layout,
  isIsolated,
  isCutaway,
  onSelectFloor,
}) => {
  const { floor, label, width, depth, corridors, elements } = layout;
  const isAnnex = floor === null;

  return (
    <group position={[isAnnex ? 34 : 0, 0, 0]}>
      {/* 1. Floor Drop Slab (Hard Offset 3D Shadow) */}
      <mesh
        position={[
          LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.x,
          -LAYOUT_CONSTANTS.SLAB_THICKNESS / 2 + LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.y,
          LAYOUT_CONSTANTS.DROP_SHADOW_OFFSET.z,
        ]}
      >
        <boxGeometry args={[width, LAYOUT_CONSTANTS.SLAB_THICKNESS, depth]} />
        <meshBasicMaterial color="#0A0A0A" />
      </mesh>

      {/* 2. Main Floor Slab */}
      <mesh
        position={[0, -LAYOUT_CONSTANTS.SLAB_THICKNESS / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFloor(floor);
        }}
      >
        <boxGeometry args={[width, LAYOUT_CONSTANTS.SLAB_THICKNESS, depth]} />
        <meshBasicMaterial color={isIsolated ? "#FFF8E7" : "#F3F4F6"} />
        <Edges linewidth={2.5} color="#0A0A0A" />
      </mesh>

      {/* 3. Central Corridor Strip */}
      {corridors.map((c) => (
        <mesh
          key={c.id}
          position={[c.x, 0.01, c.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[c.w, c.d]} />
          <meshBasicMaterial color="#E5E7EB" />
        </mesh>
      ))}

      {/* 4. Stairs and Lifts Elements */}
      {elements.map((el) => (
        <group key={el.id} position={[el.x, LAYOUT_CONSTANTS.ROOM_HEIGHT * 0.4, el.z]}>
          <mesh>
            <boxGeometry args={[el.w, LAYOUT_CONSTANTS.ROOM_HEIGHT * 0.8, el.d]} />
            <meshBasicMaterial color={el.type === "STAIR" ? "#FFD93D" : "#4D96FF"} />
            <Edges linewidth={2} color="#0A0A0A" />
          </mesh>
          <Html position={[0, LAYOUT_CONSTANTS.ROOM_HEIGHT * 0.4 + 0.3, 0]} center distanceFactor={40}>
            <span className="px-1.5 py-0.5 bg-black text-white font-mono text-[9px] font-black uppercase rounded-[2px] border border-white">
              {el.type}
            </span>
          </Html>
        </group>
      ))}

      {/* 5. Floor Tag Sticker on Edge */}
      <Html
        position={[-width / 2 - 2, 0.2, 0]}
        center
        distanceFactor={38}
        className="pointer-events-auto select-none cursor-pointer"
      >
        <button
          onClick={() => onSelectFloor(floor)}
          className="px-2.5 py-1 bg-black text-[#FFD93D] font-mono text-xs font-black uppercase rounded-[2px] border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#FF6B9D] hover:text-white transition-all whitespace-nowrap"
        >
          {floor !== null ? `F${floor}` : "ANNEX"}
        </button>
      </Html>
    </group>
  );
};
