/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ice: {
          DEFAULT: '#a0d2eb',
          light: '#d0ebf7',
          dark: '#68afd1',
        },
        freeze: {
          DEFAULT: '#e5eaf5',
          dark: '#c4d1e8',
        },
        brand: {
          50: '#f4f8fc',
          100: '#e5eaf5', // Freeze Purple tint
          200: '#cfe5f2',
          300: '#b5dcee',
          400: '#a0d2eb', // Ice Cold core
          500: '#72b6d8',
          600: '#489bc3',
          700: '#347e9e',
          800: '#235970',
          900: '#173c4c',
          950: '#0c202a',
        },
        dark: {
          bg: '#06090f',        // Pitch Black
          sidebar: '#090e17',   // Deep Obsidian
          surface: '#0f1726',   // Frosted Dark Surface
          surfaceHover: '#162136',
          border: '#1c2940',    // Subtle Frosted Border
          bubbleOut: '#a0d2eb', // Ice Cold Outgoing Bubble
          bubbleIn: '#0f1726',  // Deep Black Incoming Bubble
        }
      }
    },
  },
  plugins: [],
}
