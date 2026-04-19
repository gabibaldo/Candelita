import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca: warm violet — profesional, calmante, moderno
        brand: {
          50:  "#F8F5FF",
          100: "#EEEAFD",
          200: "#DDD4FB",
          300: "#C3ADF7",
          400: "#A580F2",
          500: "#8A58EA",
          600: "#7240DC",
          700: "#5D31BF",
          800: "#4D289F",
          900: "#3E2082",
        },
        // Neutros cálidos (stone) — más prolijos que gray puro
        ink: {
          50:  "#faf8f6",
          100: "#f1ede9",
          200: "#e2dbd4",
          300: "#c7bcaf",
          400: "#9d9084",
          500: "#776a5f",
          600: "#5a4f47",
          700: "#443c36",
          800: "#2e2925",
          900: "#1a1714",
        },
        // Acento success (sage)
        sage: {
          50:  "#f3f6f2",
          100: "#e2ebe1",
          200: "#c8d8c5",
          300: "#a4bea1",
          400: "#7fa37d",
          500: "#5f8762",
          600: "#4a6c4e",
          700: "#3c5740",
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(22,16,40,0.04), 0 4px 12px rgba(22,16,40,0.05)",
        pop:  "0 8px 24px -8px rgba(72,40,160,0.18), 0 2px 6px rgba(22,16,40,0.07)",
      },
      borderRadius: {
        xl:  "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
