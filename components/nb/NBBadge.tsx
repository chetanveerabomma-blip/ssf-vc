import React from "react";
import { clsx } from "clsx";

export interface NBBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "green" | "yellow" | "red" | "purple" | "blue" | "gray";
  size?: "sm" | "md";
}

export const NBBadge: React.FC<NBBadgeProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  const variantStyles = {
    default: "bg-white text-black border-black",
    green: "bg-[#6BCB77] text-black border-black",
    yellow: "bg-[#FFD93D] text-black border-black",
    red: "bg-[#FF3B30] text-white border-black",
    purple: "bg-[#B983FF] text-black border-black",
    blue: "bg-[#4D96FF] text-black border-black",
    gray: "bg-[#E5E7EB] text-black border-black",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
    md: "px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 border-2 rounded-[2px] font-mono leading-none shadow-[2px_2px_0px_#0A0A0A]",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
