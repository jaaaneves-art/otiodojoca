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
        terra: {
          50: "#f7f5f0",
          100: "#efeadd",
          200: "#e0d5bc",
          300: "#cebb94",
          400: "#bfa070",
          500: "#a68552",
          600: "#8c6b40",
          700: "#6b5033",
          800: "#4d3a28",
          900: "#33261e",
        },
        // Identidade própria do Gran Bazar — deliberadamente distinta da
        // paleta "terra" do Mercado da Terra (tons vivos de bazar/mercado,
        // em vez dos tons terrosos e discretos do Mercado da Terra).
        bazar: {
          50: "#fff7ed",
          100: "#ffedd2",
          200: "#ffd8a3",
          300: "#ffbc6b",
          400: "#ff9a33",
          500: "#f5790f",
          600: "#d95e08",
          700: "#b3470a",
          800: "#8f3a10",
          900: "#762f10",
        },
        // Identidade própria do Lup — verdes de economia circular /
        // regeneração, deliberadamente distinta de "terra" (tons terrosos)
        // e de "bazar" (laranja/âmbar vivo). Ver docs/LUP.md.
        lup: {
          50: "#f0fdf5",
          100: "#dcfce8",
          200: "#b8f5cf",
          300: "#86e8ab",
          400: "#4dd280",
          500: "#22b45e",
          600: "#16924a",
          700: "#12723c",
          800: "#115a33",
          900: "#0f4a2c",
        },
        // Identidade própria de Viaturas (StandGo) — azul, seguindo os
        // requisitos de design do MVP StandGo original (#2563eb + slate),
        // deliberadamente distinta de "terra", "bazar" e "lup". Ver
        // docs/VIATURAS.md.
        viaturas: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
