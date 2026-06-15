import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cinema-noir palette
        ink: "#0a0a0c", // near-black base
        char: "#101013", // charcoal
        panel: "#16130f", // warm dark panel
        panel2: "#1f1a14",
        cream: "#f4ece0", // warm off-white text
        crimson: {
          DEFAULT: "#c81e3a", // velvet seat red
          deep: "#8e1428",
          glow: "#ff3355",
        },
        gold: {
          DEFAULT: "#d4a24e", // art-deco gold
          soft: "#e8c987",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        marquee: "0.12em",
      },
      boxShadow: {
        glow: "0 0 30px -8px rgba(255,51,85,0.5)",
        goldglow: "0 0 24px -6px rgba(212,162,78,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "94%": { opacity: "0.7" },
          "96%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        flicker: "flicker 6s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
