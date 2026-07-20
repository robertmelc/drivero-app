import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#05070A",
        signal: "#34E37A",
        "signal-dim": "#1F9D57",
        mint: "#AFFFD4",
        ink: "#E9F3EC",
        muted: "#8FA69B",
        amber: "#E2C23D",
        danger: "#E35C5C",
      },
      borderRadius: {
        pill: "999px",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
