import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        hot: "var(--hot)",
        wash: "var(--wash)",
      },
      fontFamily: {
        display: ["'Big Shoulders Display'", "'Big Shoulders'", "sans-serif"],
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
      },
      animation: {
        drop: "filmDrop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both",
      },
      keyframes: {
        filmDrop: {
          from: { transform: "translateY(-1.5rem) rotate(-2deg)", opacity: "0" },
          to: { transform: "translateY(0) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
