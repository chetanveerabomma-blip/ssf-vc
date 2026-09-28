"use client";

import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
  AdaptiveDpr,
  PerformanceMonitor,
} from "@react-three/drei";
import { BuildingMap } from "./BuildingMap";
import { BuildingLayoutData } from "@/lib/layout/types";
import { RoomAvailabilityStatus } from "@/lib/engine";
import { SquadClaimData, MapViewState } from "./types";
import { LAYOUT_CONSTANTS } from "@/lib/layout/generator";

interface BuildingSceneProps {
  layoutData: BuildingLayoutData;
  roomsStatusMap: Record<string, RoomAvailabilityStatus>;
  claimsMap: Record<string, SquadClaimData>;
  viewState: MapViewState;
  pulseRoomIds?: string[];
  onSelectRoom: (roomId: string) => void;
  onHoverRoom: (roomId: string | null) => void;
  onSelectFloor: (floor: number | null | "ALL") => void;
  onDeselect: () => void;
}

export const BuildingScene: React.FC<BuildingSceneProps> = ({
  layoutData,
  roomsStatusMap,
  claimsMap,
  viewState,
  pulseRoomIds,
  onSelectRoom,
  onHoverRoom,
  onSelectFloor,
  onDeselect,
}) => {
  const cameraControlsRef = useRef<CameraControls | null>(null);

  // Smooth camera fly-to when selectedRoomId changes
  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (!controls) return;

    if (viewState.selectedRoomId) {
      // Find room coordinates
      for (const floor of layoutData.floors) {
        const found = floor.rooms.find((r) => r.roomId === viewState.selectedRoomId);
        if (found) {
          const floorY = floor.floor !== null
            ? floor.floor * LAYOUT_CONSTANTS.FLOOR_HEIGHT * (viewState.isExploded ? 2.2 : 1.0)
            : 0;
          const targetX = floor.floor === null ? 34 + found.x : found.x;
          const targetY = floorY + LAYOUT_CONSTANTS.ROOM_HEIGHT / 2;
          const targetZ = found.z;

          controls.setLookAt(
            targetX + 18,
            targetY + 16,
            targetZ + 22,
            targetX,
            targetY,
            targetZ,
            true
          );
          return;
        }
      }
    } else {
      // Reset to overview
      controls.setLookAt(45, 45, 45, 0, 12, 0, true);
    }
  }, [viewState.selectedRoomId, layoutData, viewState.isExploded]);

  return (
    <div className="relative w-full h-[600px] lg:h-[750px] bg-[#FFF8E7] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] overflow-hidden select-none">
      <Canvas
        frameloop="demand"
        shadows={false}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerDown={(e) => {
          // If clicked canvas background, deselect
          if ((e.target as HTMLElement).tagName === "CANVAS") {
            onDeselect();
          }
        }}
      >
        <color attach="background" args={["#FFF8E7"]} />

        {/* Camera based on perspective / orthographic mode */}
        {viewState.cameraMode === "orthographic" ? (
          <OrthographicCamera
            makeDefault
            zoom={15}
            position={[45, 45, 45]}
            near={-100}
            far={500}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            fov={40}
            position={[45, 45, 45]}
            near={0.1}
            far={1000}
          />
        )}

        {/* CameraControls for smooth damped orbiting and flying */}
        <CameraControls
          ref={cameraControlsRef}
          smoothTime={0.4}
          dollySpeed={0.8}
          truckSpeed={0.8}
          minDistance={10}
          maxDistance={250}
        />

        {/* Ambient lighting for flat unlit neobrutalism look */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[20, 40, 20]} intensity={0.5} />

        {/* Dotted Ground Grid */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[160, 160]} />
          <meshBasicMaterial color="#F5EFE0" />
        </mesh>
        <gridHelper
          args={[160, 40, "#0A0A0A", "#E0D7C3"]}
          position={[0, -0.9, 0]}
        />

        {/* The Procedural Multi-Floor Building */}
        <BuildingMap
          layoutData={layoutData}
          roomsStatusMap={roomsStatusMap}
          claimsMap={claimsMap}
          viewState={viewState}
          pulseRoomIds={pulseRoomIds}
          onSelectRoom={onSelectRoom}
          onHoverRoom={onHoverRoom}
          onSelectFloor={onSelectFloor}
        />

        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
      </Canvas>
    </div>
  );
};
