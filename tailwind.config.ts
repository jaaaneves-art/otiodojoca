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
      },
    },
  },
  plugins: [],
};

export default config;
