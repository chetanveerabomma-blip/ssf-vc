"use client";

import React, { useState } from "react";
import { RoomQuery } from "@/lib/schemas";
import { RULES } from "@/config/rules";
import { Edit3, Check, X } from "lucide-react";

export interface InterpretationStripProps {
  query: RoomQuery;
  assumptions: string[];
  onUpdateQuery: (newQuery: RoomQuery) => void;
}

export const InterpretationStrip: React.FC<InterpretationStripProps> = ({
  query,
  assumptions,
  onUpdateQuery,
}) => {
  const [editing, setEditing] = useState(false);
  const [floorVal, setFloorVal] = useState<string>(
    query.floor !== undefined ? query.floor.join(",") : "all"
  );
  const [acVal, setAcVal] = useState<string>(
    query.ac === true ? "yes" : query.ac === false ? "no" : "any"
  );
  const [durationVal, setDurationVal] = useState<number>(query.durationMin || 60);
  const [startVal, setStartVal] = useState<string>(query.startTime || "10:15");
  const [capacityVal, setCapacityVal] = useState<number>(query.minCapacity || 0);

  const handleSave = () => {
    const updated: RoomQuery = {
      ...query,
      floor: floorVal === "all" ? undefined : floorVal.split(",").map(Number),
      ac: acVal === "yes" ? true : acVal === "no" ? false : undefined,
      durationMin: Number(durationVal),
      startTime: startVal,
      minCapacity: Number(capacityVal) > 0 ? Number(capacityVal) : undefined,
      assumptions: [
        ...assumptions.filter((a) => !a.includes("Manual override")),
        "Manual parameter adjustment applied",
      ],
    };
    onUpdateQuery(updated);
    setEditing(false);
  };

  return (
    <div className="w-full bg-[#FFF8E7] border-[3px] border-black rounded-[4px] p-3 sm:p-4 shadow-[4px_4px_0px_#0A0A0A] mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <span className="font-heading font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#FF6B9D] border border-black inline-block rounded-xs" />
          INTERPRETED SEARCH CRITERIA
        </span>
        <button
          onClick={() => setEditing(!editing)}
          className="self-start sm:self-auto px-2.5 py-1 bg-white border border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#FFD93D] flex items-center gap-1"
        >
          {editing ? (
            <>
              <X size={12} /> CANCEL
            </>
          ) : (
            <>
              <Edit3 size={12} /> EDIT CHIPS (RE-RUNS DIRECTLY)
            </>
          )}
        </button>
      </div>

      {!editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Floor Chip */}
          <span className="px-2.5 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
            FLOOR:{" "}
            {query.floor && query.floor.length > 0
              ? query.floor.map((f) => (f === 0 ? "GROUND (0)" : `FL ${f}`)).join(", ")
              : "ANY"}
          </span>

          {/* AC Chip */}
          <span className="px-2.5 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
            AC: {query.ac === true ? "YES" : query.ac === false ? "NO" : "ANY"}
          </span>

          {/* Duration Chip */}
          <span className="px-2.5 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
            DURATION: {query.durationMin || 60} MIN
          </span>

          {/* Start Time Chip */}
          <span className="px-2.5 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
            FROM: {query.startTime || "NOW"}
          </span>

          {/* Capacity / Group Chip */}
          {query.minCapacity && (
            <span className="px-2.5 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
              GROUP: ~{query.minCapacity} PEOPLE
            </span>
          )}

          {/* Assumptions */}
          {assumptions.map((assump, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-[#FFD93D] border-2 border-black rounded-[2px] font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#0A0A0A]"
            >
              {assump}
            </span>
          ))}
        </div>
      ) : (
        /* Edit Form inside the Strip */
        <div className="pt-2 border-t-2 border-black space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block font-heading text-[10px] font-black uppercase mb-1">
                Floor
              </label>
              <select
                value={floorVal}
                onChange={(e) => setFloorVal(e.target.value)}
                className="w-full p-1.5 font-mono text-xs border-2 border-black rounded bg-white"
              >
                <option value="all">Any Floor</option>
                <option value="0">Ground Floor (0)</option>
                <option value="1">First Floor (1)</option>
                <option value="2">Second Floor (2)</option>
                <option value="3">Third Floor (3)</option>
                <option value="4">Fourth Floor (4)</option>
                <option value="5">Fifth Floor (5)</option>
                <option value="6">Sixth Floor (6)</option>
              </select>
            </div>

            <div>
              <label className="block font-heading text-[10px] font-black uppercase mb-1">
                AC Status
              </label>
              <select
                value={acVal}
                onChange={(e) => setAcVal(e.target.value)}
                className="w-full p-1.5 font-mono text-xs border-2 border-black rounded bg-white"
              >
                <option value="any">Any / Don't Care</option>
                <option value="yes">AC Required</option>
                <option value="no">Non-AC</option>
              </select>
            </div>

            <div>
              <label className="block font-heading text-[10px] font-black uppercase mb-1">
                Start (HH:mm)
              </label>
              <input
                type="text"
                value={startVal}
                onChange={(e) => setStartVal(e.target.value)}
                className="w-full p-1.5 font-mono text-xs border-2 border-black rounded bg-white"
              />
            </div>

            <div>
              <label className="block font-heading text-[10px] font-black uppercase mb-1">
                Duration (Min)
              </label>
              <input
                type="number"
                value={durationVal}
                onChange={(e) => setDurationVal(Number(e.target.value))}
                className="w-full p-1.5 font-mono text-xs border-2 border-black rounded bg-white"
              />
            </div>

            <div>
              <label className="block font-heading text-[10px] font-black uppercase mb-1">
                Capacity
              </label>
              <input
                type="number"
                value={capacityVal}
                onChange={(e) => setCapacityVal(Number(e.target.value))}
                className="w-full p-1.5 font-mono text-xs border-2 border-black rounded bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#6BCB77] border-2 border-black rounded-[2px] font-heading text-xs font-black uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#5bbd67] flex items-center gap-1"
            >
              <Check size={14} /> APPLY & RE-SEARCH
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
