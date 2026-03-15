/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    preflight: false, // Disable Tailwind reset to avoid conflicts with MUI
  },
  important: '#root', // Ensure Tailwind classes win over MUI defaults
  theme: {
    extend: {},
  },
  plugins: [],
}
