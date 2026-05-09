/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Fraunces', 'Georgia', 'serif'],
        mono:  ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
