/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a2e',
          hover: '#1e1e30',
          glass: 'rgba(255,255,255,0.05)',
        },
        accent: {
          red: '#e50914',
          gold: '#f5c518',
          blue: '#0056ff',
          purple: '#7c3aed',
          glow: '#a855f7',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0aec0',
          muted: '#4a5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, rgba(10,10,15,1) 30%, rgba(10,10,15,0.6) 70%, rgba(10,10,15,0) 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0) 100%)',
        'shimmer': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
