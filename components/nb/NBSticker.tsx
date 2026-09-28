import React from "react";

export interface NBStickerProps {
  text?: string;
  children?: React.ReactNode;
  color?: "yellow" | "pink" | "blue" | "green" | "red" | "purple";
  rotation?: string;
  rotate?: string | number;
  className?: string;
}

export const NBSticker: React.FC<NBStickerProps> = ({
  text,
  children,
  color = "yellow",
  rotation = "-2deg",
  rotate,
  className = "",
}) => {
  const colorStyles = {
    yellow: "bg-nb-yellow text-nb-ink",
    pink: "bg-nb-pink text-nb-ink",
    blue: "bg-nb-blue text-white",
    green: "bg-nb-green text-nb-ink",
    red: "bg-nb-red text-white",
    purple: "bg-nb-purple text-nb-ink",
  };

  const rotVal = rotate !== undefined ? `${rotate}deg` : rotation;

  return (
    <div
      style={{ transform: `rotate(${rotVal})` }}
      className={`inline-block font-heading uppercase font-black text-xs px-2.5 py-1 border-[3px] border-nb-ink shadow-[3px_3px_0px_#0A0A0A] select-none tracking-widest ${colorStyles[color] || colorStyles.yellow} ${className}`}
    >
      ★ {children || text}
    </div>
  );
};
