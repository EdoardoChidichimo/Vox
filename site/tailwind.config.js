/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0B1220',
          800: '#0F1A2B',
          700: '#14233A',
          600: '#19304E',
          500: '#204066',
          400: '#2B5A8A',
          300: '#3777B2',
          200: '#5EA0DA',
          100: '#A6C9ED'
        }
      },
      boxShadow: {
        hard: '0 0 0 1px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        none: '0',
      }
    },
  },
  plugins: [],
};


