/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/ui/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'float-1': {
          '0%, 100%': { transform: 'translateY(0) rotate(12deg)' },
          '50%': { transform: 'translateY(-20px) rotate(14deg)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translateY(0) rotate(-12deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-10deg)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translateY(0) rotate(45deg)' },
          '50%': { transform: 'translateY(-25px) rotate(48deg)' },
        },
      },
      animation: {
        'float-1': 'float-1 6s ease-in-out infinite',
        'float-2': 'float-2 8s ease-in-out infinite',
        'float-3': 'float-3 7s ease-in-out infinite',
      },
      colors: {
        paper: '#F9F6F0',
        wood: {
          DEFAULT: '#8B7355',
          light: '#A89883',
          dark: '#5D4D39'
        },
        leather: '#A87D5F',
        ink: '#2C3E50',
        gold: '#D4AF37',
        burgundy: '#8E354A',
        sage: '#9CAF88',
        cream: '#FFF8E7',
        sand: '#E8DFD0',
      },
      fontFamily: {
        serif: ['Crimson Text', 'Garamond', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      letterSpacing: {
        wide: '.025em',
      },
      backgroundImage: {
        'gradient-wood': 'linear-gradient(to right, var(--color-wood), var(--color-leather-dark))',
        'gradient-parchment': 'linear-gradient(to bottom, var(--color-parchment), var(--color-cream))',
      }
    },
  },
  plugins: [],
}
