// @ts-check
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.mdx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", ...fontFamily.sans],
      },
      keyframes: {
        // Ticker marquee. The track holds two identical copies of the rows, so
        // travelling exactly -50% lands copy 2 where copy 1 started and the
        // loop is seamless.
        tape: {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        // Price flash on an up/down tick.
        flashUp: {
          "0%": { backgroundColor: "rgba(31,169,122,0.22)" },
          "100%": { backgroundColor: "transparent" },
        },
        flashDown: {
          "0%": { backgroundColor: "rgba(217,84,77,0.22)" },
          "100%": { backgroundColor: "transparent" },
        },
        // Equity curve draw-on.
        drawIn: {
          from: { strokeDashoffset: "var(--dash)" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        tape: "tape 60s linear infinite",
        flashUp: "flashUp 600ms ease-out",
        flashDown: "flashDown 600ms ease-out",
      },
      typography: {
        quoteless: {
          css: {
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:first-of-type::after": { content: "none" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
