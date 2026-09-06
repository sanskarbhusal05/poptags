/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#09090b',
        darkCard: '#18181b',
        darkBorder: '#27272a',
      }
    },
  },
  plugins: [],
}
