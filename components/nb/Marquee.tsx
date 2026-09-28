import React from "react";
import { clsx } from "clsx";

export interface MarqueeProps {
  text?: string;
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  text = "LIVE ROOM AVAILABILITY • 12 SECTIONS • ALL FLOORS • UPDATED EVERY MINUTE • REAL-TIME SRM TRICHY EEE TIMETABLES • FREE / OCCUPIED / SOON STATUS • ",
  className,
}) => {
  return (
    <div
      className={clsx(
        "w-full h-8 bg-black text-[#FFD93D] overflow-hidden whitespace-nowrap border-b-[3px] border-black flex items-center select-none",
        className
      )}
    >
      <div className="inline-block animate-marquee motion-reduce:animate-none font-mono text-xs font-bold uppercase tracking-widest">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
};
