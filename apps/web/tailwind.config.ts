import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        surface: "#f7f8fb",
        mint: "#2f9f89",
        amber: "#d48a2c",
        berry: "#9f3f68"
      }
    }
  },
  plugins: []
};

export default config;
