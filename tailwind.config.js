/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        lexend: ['Lexend', 'sans-serif'],
      },
      backgroundImage: {
        'Radial': `radial-gradient(circle at 25% center, #5C1B33, transparent 90%), 
                radial-gradient(circle at 75% center, #2618A7, transparent 80%)`,
      },
        keyframes: {
          spinCustom: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        },
        animation: {
          spinCustom: 'spinCustom 1s linear infinite',
        },
    
        },
    },
  plugins: [],
};
