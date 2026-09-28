import React from "react";

export interface MarqueeProps {
  text?: string;
  items?: string[];
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  text,
  items = [
    "SEMESTER ENDS: 29 NOV 2026",
    "DETENTION THRESHOLD: 75% STRICT",
    "TARGET ATTENDANCE: 90%",
    "SRM TRICHY • SCHOOL OF EEE",
    "LAB PERIODS COUNT AS MANDATORY SESSIONS",
    "CHECK YOUR RECOVERY PLAN REGULARLY",
    "OFFICIAL DEANERY NOTIFICATION COMPLIANT",
  ],
  className = "",
}) => {
  const displayItems = items || (text ? [text] : []);
  const repeated = [...displayItems, ...displayItems, ...displayItems];

  return (
    <div
      className={`w-full overflow-hidden bg-nb-yellow border-b-[3px] border-nb-ink py-1.5 select-none ${className}`}
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {repeated.map((item, idx) => (
          <span
            key={idx}
            className="mx-4 font-mono uppercase font-bold text-xs tracking-widest text-nb-ink flex items-center"
          >
            <span className="text-nb-red mr-2 font-black">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
