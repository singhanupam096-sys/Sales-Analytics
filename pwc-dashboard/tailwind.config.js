/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1F4",
        ink: "#10233B",
        teal: "#0F6B5C",
        gold: "#C08A2E",
        brick: "#B23A48",
        line: "#D8DEE4",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"IBM Plex Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
