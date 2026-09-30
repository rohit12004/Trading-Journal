/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          850: '#1d1d1d',
          950: '#0a0a0a',
          955: '#050505',
        },
      },
    },
  },
  plugins: [],
}
