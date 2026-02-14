/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Modern Indigo Brand Color
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // Slate for professional dark mode
        slate: {
          850: '#1e293b',
          900: '#0f172a', 
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Standard modern font
      }
    },
  },
  plugins: [],
};