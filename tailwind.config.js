/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/renderer/**/*.{html,ts}", "./dist/renderer/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        editor: {
          bg: "#1e1e1e",
          text: "#d4d4d4",
          line: "#858585",
          selection: "#264f78",
        },
        tab: {
          bg: "#2d2d2d",
          active: "#1e1e1e",
          hover: "#383838",
          border: "#3c3c3c",
        },
        toolbar: {
          bg: "#333333",
          hover: "#4a4a4a",
          border: "#484848",
        },
      },
    },
  },
  plugins: [],
};
