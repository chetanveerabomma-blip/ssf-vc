"use client";

import React from "react";
import Link from "next/link";
import { NBButton } from "@/components/nb/NBButton";
import { NBSticker } from "@/components/nb/NBSticker";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-block">
        <NBSticker color="purple" rotate="1" className="text-sm px-4 py-2">
          SYSTEM FAULT (500)
        </NBSticker>
      </div>

      <div className="w-20 h-20 bg-[#FF3B30] text-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex items-center justify-center mx-auto">
        <AlertTriangle size={40} />
      </div>

      <h1 className="font-heading font-black text-4xl uppercase tracking-tight text-black">
        FLOOR ENGINE ENCOUNTERED AN ERROR
      </h1>

      <div className="p-4 bg-white border-2 border-black rounded-[4px] font-mono text-xs text-red-600 max-w-lg mx-auto overflow-x-auto shadow-[3px_3px_0px_#0A0A0A]">
        {error.message || "An unexpected error occurred while computing room allocations."}
      </div>

      <div className="pt-2 flex justify-center gap-4">
        <NBButton variant="pink" size="md" onClick={() => reset()}>
          <RotateCcw size={16} /> RETRY OPERATION
        </NBButton>
        <Link href="/grid">
          <NBButton variant="secondary" size="md">
            RESET TO FLOOR GRID
          </NBButton>
        </Link>
      </div>
    </div>
  );
}
