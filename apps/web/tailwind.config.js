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
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        berry: "rgb(var(--color-berry) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
