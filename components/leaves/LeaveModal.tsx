"use client";

import React, { useState } from "react";
import { LeaveInput } from "@/lib/engine";
import { LeaveType } from "@/config/policy";
import { NBModal } from "../nb/NBModal";
import { NBButton } from "../nb/NBButton";
import { NBInput } from "../nb/NBInput";
import { format, addDays, parseISO } from "date-fns";

export interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLeave: (leave: LeaveInput) => void;
  todayDate: string;
  subjectsList: { code: string; name: string }[];
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  onSaveLeave,
  todayDate,
  subjectsList,
}) => {
  const [type, setType] = useState<LeaveType>("OD");
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [daysCount, setDaysCount] = useState(1);
  const [scope, setScope] = useState("ALL");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<"MORNING" | "AFTERNOON">("MORNING");
  const [medicalApproved, setMedicalApproved] = useState(false);
  const [isAlreadyTaken, setIsAlreadyTaken] = useState(false);
  const [note, setNote] = useState("");

  const handleDaysChange = (days: number) => {
    const d = Math.max(1, days);
    setDaysCount(d);
    try {
      const s = parseISO(startDate);
      const e = addDays(s, d - 1);
      setEndDate(format(e, "yyyy-MM-dd"));
    } catch {}
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    try {
      const s = parseISO(val);
      const e = addDays(s, daysCount - 1);
      setEndDate(format(e, "yyyy-MM-dd"));
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLeave({
      id: Math.random().toString(36).substring(2, 9),
      type,
      startDate,
      endDate,
      scope,
      isHalfDay,
      halfDayType: isHalfDay ? halfDayType : undefined,
      medicalApproved: type === "MEDICAL" ? medicalApproved : false,
      isAlreadyTaken,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <NBModal isOpen={isOpen} onClose={onClose} title="SIMULATE OR RECORD LEAVE SCENARIO">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Segmented Control */}
        <div>
          <label className="block font-heading uppercase text-xs font-black tracking-wider text-nb-ink mb-1.5">
            Leave Category (OD / Medical / Absent)
          </label>
          <div className="grid grid-cols-3 border-[3px] border-nb-ink shadow-[3px_3px_0px_#0A0A0A]">
            <button
              type="button"
              onClick={() => setType("OD")}
              className={`py-2 font-heading font-black text-xs uppercase tracking-wider transition-colors ${
                type === "OD" ? "bg-nb-purple text-nb-ink" : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              ★ OD (On-Duty)
            </button>
            <button
              type="button"
              onClick={() => setType("MEDICAL")}
              className={`py-2 font-heading font-black text-xs uppercase tracking-wider border-x-2 border-nb-ink transition-colors ${
                type === "MEDICAL" ? "bg-nb-pink text-nb-ink" : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              + Medical Leave
            </button>
            <button
              type="button"
              onClick={() => setType("ABSENT")}
              className={`py-2 font-heading font-black text-xs uppercase tracking-wider transition-colors ${
                type === "ABSENT" ? "bg-nb-yellow text-nb-ink" : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              - Plain Absent
            </button>
          </div>
        </div>

        {/* Real vs Planned Segmented Switch */}
        <div className="bg-zinc-50 border-2 border-nb-ink p-3 space-y-2">
          <label className="block font-heading uppercase text-xs font-black text-zinc-800">
            Timeline Nature
          </label>
          <div className="flex border-2 border-nb-ink">
            <button
              type="button"
              onClick={() => setIsAlreadyTaken(false)}
              className={`flex-1 py-1.5 font-mono text-xs font-bold uppercase ${
                !isAlreadyTaken ? "bg-nb-blue text-white" : "bg-white text-zinc-600"
              }`}
            >
              Hypothetical / Planned (Forecast)
            </button>
            <button
              type="button"
              onClick={() => setIsAlreadyTaken(true)}
              className={`flex-1 py-1.5 font-mono text-xs font-bold uppercase border-l-2 border-nb-ink ${
                isAlreadyTaken ? "bg-nb-blue text-white" : "bg-white text-zinc-600"
              }`}
            >
              Already Taken (Past Adjustment)
            </button>
          </div>
        </div>

        {/* Date Ranges and Duration Shortcut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
              Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
              End Date:
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
              Days Shortcut:
            </label>
            <input
              type="number"
              min="1"
              max="45"
              value={daysCount}
              onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
            />
          </div>
        </div>

        {/* Medical Certificate Toggle (only if MEDICAL) */}
        {type === "MEDICAL" && (
          <div className="bg-pink-50 border-2 border-nb-pink p-3 flex items-center justify-between">
            <div>
              <span className="font-heading uppercase text-xs font-black text-pink-900 block">
                Medical Certificate Approved?
              </span>
              <span className="font-mono text-[11px] text-zinc-600">
                Approved certificate converts handling to AS_PRESENT / Condonation under policy.
              </span>
            </div>
            <input
              type="checkbox"
              checked={medicalApproved}
              onChange={(e) => setMedicalApproved(e.target.checked)}
              className="w-5 h-5 border-2 border-nb-ink text-nb-pink rounded-none cursor-pointer"
            />
          </div>
        )}

        {/* Scope Dropdown */}
        <div>
          <label className="block font-heading uppercase text-xs font-black text-nb-ink mb-1">
            Course Scope
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full px-3 py-2 bg-white font-mono text-xs border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
          >
            <option value="ALL">All Subjects in Timetable</option>
            {subjectsList.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Half Day Option */}
        <div className="border-2 border-nb-ink p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="w-4 h-4 border-2 border-nb-ink text-nb-yellow rounded-none"
            />
            <span className="font-heading uppercase text-xs font-black text-nb-ink">
              Half-Day Leave (Specific Session Only)
            </span>
          </label>

          {isHalfDay && (
            <div className="flex gap-4 pt-1 font-mono text-xs pl-6">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDayType"
                  checked={halfDayType === "MORNING"}
                  onChange={() => setHalfDayType("MORNING")}
                />
                <span>Morning (Periods 1-3)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDayType"
                  checked={halfDayType === "AFTERNOON"}
                  onChange={() => setHalfDayType("AFTERNOON")}
                />
                <span>Afternoon (Periods 4-6)</span>
              </label>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block font-mono text-[11px] font-bold text-zinc-700 mb-1">
            Reason / Notes (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. SRM Tech Fest Organising Committee or Viral Fever"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-1.5 font-mono text-xs border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t-[2px] border-zinc-200">
          <NBButton size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </NBButton>
          <NBButton size="sm" variant="primary" type="submit">
            Apply Simulation
          </NBButton>
        </div>
      </form>
    </NBModal>
  );
};
