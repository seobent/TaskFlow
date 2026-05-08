/** @type {import("tailwindcss").Config} */
const config = {
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
  },
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        surface: "#f7f8fb",
        mint: "#2f9f89",
        amber: "#d48a2c",
        berry: "#9f3f68",
      },
    },
  },
  plugins: [],
};

module.exports = config;
