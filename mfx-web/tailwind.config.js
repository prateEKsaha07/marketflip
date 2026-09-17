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
      // Global font-size scale 
      fontSize: {
        'xs':   ['0.6875rem', { lineHeight: '1rem' }],      // 11px  (was 12px)
        'sm':   ['0.8125rem', { lineHeight: '1.15rem' }],   // 13px  (was 14px)
        'base': ['0.875rem',  { lineHeight: '1.25rem' }],   // 14px  (was 16px)
        'lg':   ['1rem',      { lineHeight: '1.5rem' }],    // 16px  (was 18px)
        'xl':   ['1.125rem',  { lineHeight: '1.6rem' }],    // 18px  (was 20px)
        '2xl':  ['1.25rem',   { lineHeight: '1.75rem' }],   // 20px  (was 24px)
        '3xl':  ['1.5rem',    { lineHeight: '2rem' }],      // 24px  (was 30px)
        '4xl':  ['1.875rem',  { lineHeight: '2.25rem' }],   // 30px  (was 36px)
        '5xl':  ['2.25rem',   { lineHeight: '2.5rem' }],    // 36px  (was 48px)
      },
      colors: {
        peach: '#FFBE91',
        cream: '#FFDDB0',
        lightCream: '#FFFCE1',
        softBlue: '#CFEBFF',
        ink: '#1A1A2E',
        muted: '#A0A0B0',
        canvas: '#F8F6F0',
        line: '#EEECE6',
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
        // Core — used across all pages
        'gradient': 'gradient 8s ease-in-out infinite',
        'gradient-slow': 'gradient 12s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 1.5s infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',

        // Loading
        'shimmer': 'shimmer 1.8s ease-in-out infinite',

        // Entrances
        'fade-in': 'fadeIn 0.4s ease-out both',
        'fade-up': 'fadeUp 0.4s ease-out both',
        'slide-in-left': 'slideInLeft 0.35s ease-out both',

        // Accents
        'glow': 'glow 2.5s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
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
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 190, 145, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255, 190, 145, 0.35)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FFBE91 0%, #FFDDB0 50%, #FFFCE1 100%)',
        'gradient-soft': 'linear-gradient(135deg, #CFEBFF 0%, #FFFCE1 50%, #FFDDB0 100%)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}