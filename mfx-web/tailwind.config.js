/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'system-ui', 'sans-serif'],
        display: ['Ubuntu', 'sans-serif'],
      },
      colors: {
        peach: '#FFBE91',
        cream: '#FFDDB0',
        lightCream: '#FFFCE1',
        softBlue: '#CFEBFF',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FFBE91",
          foreground: "#1A1A2E",
        },
        secondary: {
          DEFAULT: "#FFDDB0",
          foreground: "#1A1A2E",
        },
        accent: {
          DEFAULT: "#CFEBFF",
          foreground: "#1A1A2E",
        },
      },
      animation: {
        'gradient': 'gradient 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FFBE91 0%, #FFDDB0 50%, #FFFCE1 100%)',
        'gradient-soft': 'linear-gradient(135deg, #CFEBFF 0%, #FFFCE1 50%, #FFDDB0 100%)',
      },
    },
  },
  plugins: [],
}