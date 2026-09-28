import React from "react";
import { clsx } from "clsx";

export interface NBButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "pink" | "yellow" | "green" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const NBButton: React.FC<NBButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#FF6B9D] text-black hover:bg-[#ff558f]",
    secondary: "bg-[#FFFFFF] text-black hover:bg-[#F3F4F6]",
    accent: "bg-[#4D96FF] text-black hover:bg-[#3b87f5]",
    pink: "bg-[#FF6B9D] text-black hover:bg-[#ff558f]",
    yellow: "bg-[#FFD93D] text-black hover:bg-[#f5cd27]",
    green: "bg-[#6BCB77] text-black hover:bg-[#5bbd67]",
    danger: "bg-[#FF3B30] text-white hover:bg-[#e03026]",
    outline: "bg-transparent text-black hover:bg-[#FFF8E7]",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-bold",
    md: "px-4 py-2 text-sm font-bold",
    lg: "px-6 py-3 text-base font-extrabold uppercase tracking-wide",
  };

  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-heading uppercase tracking-wider",
        "border-[3px] border-black rounded-[4px]",
        "shadow-[4px_4px_0px_#0A0A0A]",
        "transition-all duration-100",
        !disabled && "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#0A0A0A] active:translate-x-1 active:translate-y-1 active:shadow-none",
        disabled && "opacity-60 cursor-not-allowed shadow-[2px_2px_0px_#0A0A0A]",
        "focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
