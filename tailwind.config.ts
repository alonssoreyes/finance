import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#F5F2EA",
          muted: "#ECE6D8",
          elevated: "#FBF8F2",
          strong: "#1C1917"
        },
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
          soft: "#9CA3AF"
        },
        accent: {
          DEFAULT: "#335C4B",
          soft: "#D8E6DE",
          warm: "#B78C56",
          danger: "#8C4A46"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        card: "0 18px 40px rgba(28, 25, 23, 0.08)"
      },
      backgroundImage: {
        "soft-grid":
          "linear-gradient(rgba(28,25,23,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
