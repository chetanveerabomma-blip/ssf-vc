"use client";

import React, { useEffect, useState } from "react";
import { NBButton } from "@/components/nb/NBButton";
import { formatMinutesToTime, timeStringToMinutes, getISTNow, formatIST } from "@/lib/time";
import { Clock, Play, RotateCcw, Calendar as CalendarIcon } from "lucide-react";

export interface TimeScrubberProps {
  date: string;
  time: string;
  isLive: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onToggleLive: (live: boolean) => void;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  date,
  time,
  isLive,
  onDateChange,
  onTimeChange,
  onToggleLive,
}) => {
  const currentMinutes = timeStringToMinutes(time);
  const minTime = 480; // 08:00
  const maxTime = 1080; // 18:00

  // Auto-refresh interval if isLive is true
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const now = getISTNow();
      onTimeChange(formatIST(now, "HH:mm"));
      onDateChange(formatIST(now, "yyyy-MM-dd"));
    }, 60000);
    return () => clearInterval(interval);
  }, [isLive, onTimeChange, onDateChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onTimeChange(formatMinutesToTime(val));
    if (isLive) onToggleLive(false);
  };

  const handleNowClick = () => {
    const now = getISTNow();
    onTimeChange(formatIST(now, "HH:mm"));
    onDateChange(formatIST(now, "yyyy-MM-dd"));
    onToggleLive(true);
  };

  const quickJumps = [
    { label: "09:00 P1", time: "09:00" },
    { label: "10:40 TEA", time: "10:40" },
    { label: "11:40 P4", time: "11:40" },
    { label: "12:30 LUNCH", time: "12:30" },
    { label: "13:20 P6", time: "13:20" },
    { label: "15:00 TEA", time: "15:00" },
    { label: "16:00 P9", time: "16:00" },
  ];

  return (
    <div className="w-full bg-white border-[3px] border-black rounded-[4px] p-4 sm:p-5 shadow-[6px_6px_0px_#0A0A0A] space-y-4">
      {/* Top Bar: Date, Time display, and NOW button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-black" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              onDateChange(e.target.value);
              if (isLive) onToggleLive(false);
            }}
            className="px-3 py-1.5 bg-[#FFF8E7] text-black font-mono font-bold text-sm border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A] focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
          />
        </div>

        {/* Current Time Badge & NOW */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD93D] border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A]">
            <Clock size={16} />
            <span className="font-mono text-base font-black tracking-tight">{time} IST</span>
          </div>

          <NBButton
            variant={isLive ? "green" : "secondary"}
            size="sm"
            onClick={handleNowClick}
            className="flex items-center gap-1.5"
          >
            {isLive ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                LIVE (IST)
              </span>
            ) : (
              "SYNC NOW"
            )}
          </NBButton>
        </div>
      </div>

      {/* Scrubber Range Slider (08:00 to 18:00, 10 min steps) */}
      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[11px] font-bold text-gray-700">
          <span>08:00 (Campus Open)</span>
          <span className="text-black font-black uppercase">
            {time} ({Math.round(currentMinutes / 60)}h {currentMinutes % 60}m)
          </span>
          <span>18:00 (Campus Close)</span>
        </div>
        <input
          type="range"
          min={minTime}
          max={maxTime}
          step={10}
          value={Math.max(minTime, Math.min(maxTime, currentMinutes))}
          onChange={handleSliderChange}
          className="w-full h-3.5 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-[#FF6B9D] focus:outline-none"
        />
      </div>

      {/* Quick Jump Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-200">
        <span className="font-heading text-[10px] font-black uppercase text-gray-600 mr-1">
          Jump to:
        </span>
        {quickJumps.map((q) => (
          <button
            key={q.time}
            onClick={() => {
              onTimeChange(q.time);
              if (isLive) onToggleLive(false);
            }}
            className={`px-2 py-1 font-mono text-[10px] font-bold uppercase border border-black rounded-[2px] shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#FFD93D] transition-colors ${
              time === q.time ? "bg-[#FFD93D]" : "bg-white"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};
