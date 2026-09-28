import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nb: {
          bg: "#FFF8E7",
          ink: "#0A0A0A",
          card: "#FFFFFF",
          yellow: "#FFD93D",
          pink: "#FF6B9D",
          blue: "#4D96FF",
          green: "#6BCB77",
          red: "#FF3B30",
          purple: "#B983FF",
          free: "#6BCB77",
          "free-soon": "#FFD93D",
          occupied: "#FF3B30",
          conflict: "#B983FF",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        nb: "4px 4px 0px #0A0A0A",
        "nb-lg": "6px 6px 0px #0A0A0A",
        "nb-xl": "8px 8px 0px #0A0A0A",
        "nb-sm": "2px 2px 0px #0A0A0A",
        "nb-hover": "6px 6px 0px #0A0A0A",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
