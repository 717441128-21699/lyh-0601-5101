/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primary: { 50:'#E8EDF4', 100:'#C5D1E3', 200:'#9BB0CC', 300:'#718FB5', 400:'#4A6F9E', 500:'#1E3A5F', 600:'#1A3254', 700:'#152A48', 800:'#10213B', 900:'#0B1729' },
        gold: { 50:'#FBF5E8', 100:'#F5E6C0', 200:'#EBCF8A', 300:'#E0B854', 400:'#D4A843', 500:'#C49835', 600:'#A47D2A', 700:'#846320', 800:'#644A16', 900:'#44310E' },
        emerald: { 50:'#E5F5F1', 100:'#B8E4D8', 200:'#7DD4BB', 300:'#43C39E', 400:'#2D9B83', 500:'#1F7A67', 600:'#165A4C', 700:'#0E3B32', 800:'#061B18', 900:'#000000' },
        coral: { 50:'#FCE8E8', 100:'#F8C5C5', 200:'#F29B9B', 300:'#EC7171', 400:'#E05C5C', 500:'#D44747', 600:'#B03030', 700:'#8C2020', 800:'#681010', 900:'#440000' },
      },
      fontFamily: {
        display: ['DM Sans', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
