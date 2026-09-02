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
        // Luxury Gold
        gold: {
          50: '#fffdf5',
          100: '#fef9e8',
          200: '#fdf0c5',
          300: '#fbe294',
          400: '#f8cd5b',
          500: '#f5b025',
          600: '#dc8d12',
          700: '#b4650e',
          800: '#924d13',
          900: '#793e14',
          950: '#461f06',
        },
      },
    },
  },
  plugins: [],
}
