import React from "react";

export interface NBCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "white" | "yellow" | "blue" | "pink" | "green" | "danger" | "hazard";
  shadowSize?: "sm" | "md" | "lg" | "none";
}

export const NBCard: React.FC<NBCardProps> = ({
  children,
  variant = "white",
  shadowSize = "md",
  className = "",
  ...props
}) => {
  const base = "border-[3px] border-nb-ink rounded-sm transition-all";

  const shadowClasses = {
    none: "",
    sm: "shadow-[3px_3px_0px_#0A0A0A]",
    md: "shadow-[6px_6px_0px_#0A0A0A]",
    lg: "shadow-[8px_8px_0px_#0A0A0A]",
  };

  const variantClasses = {
    white: "bg-white text-nb-ink",
    yellow: "bg-nb-yellow text-nb-ink",
    blue: "bg-nb-blue text-nb-ink",
    pink: "bg-nb-pink text-nb-ink",
    green: "bg-nb-green text-nb-ink",
    danger: "bg-nb-red text-white",
    hazard: "hazard-stripes text-white font-bold",
  };

  return (
    <div
      className={`${base} ${shadowClasses[shadowSize]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
