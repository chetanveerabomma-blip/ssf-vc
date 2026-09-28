import React from "react";
import { clsx } from "clsx";

export interface NBStickerProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "yellow" | "pink" | "green" | "blue" | "red" | "purple" | "white";
  rotate?: "-3" | "-2" | "-1" | "1" | "2" | "3" | "0";
}

export const NBSticker: React.FC<NBStickerProps> = ({
  children,
  className,
  color = "yellow",
  rotate = "-2",
  ...props
}) => {
  const colorStyles = {
    yellow: "bg-[#FFD93D] text-black",
    pink: "bg-[#FF6B9D] text-black",
    green: "bg-[#6BCB77] text-black",
    blue: "bg-[#4D96FF] text-black",
    red: "bg-[#FF3B30] text-white",
    purple: "bg-[#B983FF] text-black",
    white: "bg-white text-black",
  };

  const rotateStyles = {
    "-3": "-rotate-3",
    "-2": "-rotate-2",
    "-1": "-rotate-1",
    "0": "rotate-0",
    "1": "rotate-1",
    "2": "rotate-2",
    "3": "rotate-3",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center px-3 py-1 font-heading text-xs font-black uppercase tracking-widest",
        "border-[3px] border-black rounded-[2px] shadow-[3px_3px_0px_#0A0A0A]",
        colorStyles[color],
        rotateStyles[rotate],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
