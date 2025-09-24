/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#DD0303',
          sub1: '#FA812F',
          sub2: '#FAB12F',
          bg: '#FEF3E2',
        },
        critical: '#DD0303',
      },
      boxShadow: {
        card: '0 6px 24px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
}
