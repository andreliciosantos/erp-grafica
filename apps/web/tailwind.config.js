/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9f5',
          100: '#e3f2eb',
          200: '#c5e5d6',
          300: '#9ed4bc',
          400: '#71bc9d',
          500: '#4da382',
          600: '#3b8368',
          700: '#306854',
        },
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#090e18',
        },
        pastel: {
          sage: '#52b788',
          mint: '#74c69d',
          ice: '#e8f5e9',
          cream: '#fbfbfa',
          sand: '#f4f4f0',
          lavender: '#b8b5ff',
          peach: '#ffd3b6',
          blush: '#ffaaa5',
        },
      },
    },
  },
  plugins: [],
};
