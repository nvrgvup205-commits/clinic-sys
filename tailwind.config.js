/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { 
        'cairo': ['Cairo', 'sans-serif'],
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      colors: {
        // 🏥 Solutions Medical Palette
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',  // الأساسي
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        accent: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          500: '#06B6D4',  // الفيروزي
          600: '#0891B2',
        },
        success: {
          500: '#10B981',
          600: '#059669',
        },
      },
      animation: {
        // 💓 Pulse Animations فقط - لا دوران
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'counter': 'counter 1s ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.4)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 8px rgba(14, 165, 233, 0)' },
        },
        fadeIn: { 
          '0%': { opacity: '0' }, 
          '100%': { opacity: '1' } 
        },
        slideUp: { 
          '0%': { transform: 'translateY(15px)', opacity: '0' }, 
          '100%': { transform: 'translateY(0)', opacity: '1' } 
        },
        counter: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(14, 165, 233, 0.08)',
        'medium': '0 4px 16px -4px rgba(14, 165, 233, 0.12)',
        'large': '0 8px 24px -6px rgba(14, 165, 233, 0.15)',
      },
    },
  },
  plugins: [],
}
