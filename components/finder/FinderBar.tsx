"use client";

import React, { useState } from "react";
import { NBButton } from "@/components/nb/NBButton";
import { Sparkles, ArrowRight, Loader2, Search } from "lucide-react";
import { clsx } from "clsx";

export interface FinderBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  compact?: boolean;
  initialValue?: string;
  className?: string;
}

export const FinderBar: React.FC<FinderBarProps> = ({
  onSearch,
  isLoading = false,
  compact = false,
  initialValue = "",
  className,
}) => {
  const [input, setInput] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSearch(input.trim());
  };

  const sampleChips = [
    "AC room on the ground floor for me and my team for the next 2 hours",
    "Quiet room after lunch",
    "Lab free at 3 PM Thursday",
    "Any room on 4th floor for 30 min",
  ];

  return (
    <div className={clsx("w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={300}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: AC room on the ground floor for me and my team for the next 2 hours"
              className={clsx(
                "w-full bg-white text-black font-mono border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]",
                "placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black",
                compact ? "py-2.5 pl-3.5 pr-10 text-xs sm:text-sm" : "py-3.5 pl-4 pr-12 text-sm sm:text-base"
              )}
            />
            {input.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-gray-400">
                {input.length}/300
              </span>
            )}
          </div>

          <NBButton
            type="submit"
            variant="pink"
            size={compact ? "sm" : "md"}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> SEARCHING...
              </>
            ) : (
              <>
                <Sparkles size={16} /> FIND ROOMS <ArrowRight size={16} />
              </>
            )}
          </NBButton>
        </div>
      </form>

      {!compact && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="font-heading text-[10px] font-black uppercase text-gray-600 mr-1">
            Example Queries:
          </span>
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(chip);
                onSearch(chip);
              }}
              className="px-2.5 py-1 bg-white hover:bg-[#FFD93D] border border-black rounded-[2px] font-mono text-[11px] font-bold text-gray-800 shadow-[1px_1px_0px_#0A0A0A] transition-colors text-left"
            >
              "{chip}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
