import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d12",
        panel: "#151922",
        accent: "#e11d48",
      },
    },
  },
  plugins: [],
} satisfies Config;
