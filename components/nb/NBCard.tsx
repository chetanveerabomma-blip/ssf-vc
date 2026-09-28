import React from "react";
import { clsx } from "clsx";

export interface NBCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "white" | "yellow" | "pink" | "blue" | "cream" | "purple" | "conflict";
  shadow?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

export const NBCard: React.FC<NBCardProps> = ({
  children,
  className,
  variant = "white",
  shadow = "md",
  interactive = false,
  ...props
}) => {
  const variantStyles = {
    white: "bg-white text-black",
    cream: "bg-[#FFF8E7] text-black",
    yellow: "bg-[#FFD93D] text-black",
    pink: "bg-[#FF6B9D] text-black",
    blue: "bg-[#4D96FF] text-black",
    purple: "bg-[#B983FF] text-black",
    conflict:
      "bg-[#B983FF] bg-[repeating-linear-gradient(45deg,#B983FF,#B983FF_10px,#a56afc_10px,#a56afc_20px)] text-black",
  };

  const shadowStyles = {
    none: "shadow-none",
    sm: "shadow-[2px_2px_0px_#0A0A0A]",
    md: "shadow-[4px_4px_0px_#0A0A0A]",
    lg: "shadow-[6px_6px_0px_#0A0A0A]",
  };

  return (
    <div
      className={clsx(
        "border-[3px] border-black rounded-[4px] p-4 transition-all duration-100",
        variantStyles[variant],
        shadowStyles[shadow],
        interactive &&
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#0A0A0A] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
