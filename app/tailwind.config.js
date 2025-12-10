/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'gray-light': '#EFF1F5',
        'gray-medium': '#A09CAB',
        'teal': '#80D1C1',
        'green': '#78B948',
      },
      boxShadow: {
        'custom': '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
