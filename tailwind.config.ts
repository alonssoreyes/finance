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
          DEFAULT: "#F4F8FC",
          muted: "#E7EFF8",
          elevated: "#FFFFFF",
          strong: "#0B1628"
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#5B6B82",
          soft: "#92A0B5"
        },
        accent: {
          DEFAULT: "#1098F7",
          soft: "#DDEFFF",
          warm: "#14C8B2",
          danger: "#F25F5C"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        card: "0 18px 44px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        "soft-grid":
          "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
