/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#050709',
          800: '#0a0e17',
          700: '#0f1520',
          600: '#141923',
          500: '#1a2130',
          400: '#222b3d',
          300: '#2d3748',
          200: '#4a5568',
          100: '#718096',
        },
        accent: {
          gold: '#f5c518',
          goldHover: '#ffd633',
          goldDark: '#c9a000',
          red: '#e50914',
          redHover: '#ff1a25',
        },
        darkBackground: {
          50: "#edf1fc",
          100: "#dae5f9",
          200: "#b5cbf3",
          300: "#90b1ed",
          400: "#6b97e7",
          500: "#467de1",
          600: "#3764b4",
          700: "#284b87",
          800: "#19325a",
          900: "#0a192d",
        },
        premier: {
          50: "#edf4fd",
          100: "#dae9fb",
          200: "#b5d3f7",
          300: "#90bdf3",
          400: "#6ba7ef",
          500: "#4691eb",
          600: "#3873bc",
          700: "#2a558d",
          800: "#1c375e",
          900: "#0e192f",
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(245, 197, 24, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(245, 197, 24, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
