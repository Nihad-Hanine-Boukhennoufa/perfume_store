/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      
      colors: {
        obsidian:   "#0D0D0D",
        ink:        "#1A1A1A",
        charcoal:   "#2A2A2A",
        smoke:      "#3D3D3D",
        mist:       "#8A8A8A",
        gold:       "#C9A84C",
        "gold-light":"#E8D5A3",
        "gold-dark": "#8B6914",
        pearl:      "#F0EDE8",
        cream:      "#FAF8F5",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body:    ["'Jost'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};