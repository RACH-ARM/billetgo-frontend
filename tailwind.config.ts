import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D0D1A',
          secondary: '#13132A',
          card: '#1A1A35',
        },
        violet: {
          neon: '#7B2FBE',
          light: '#9B4FDE',
        },
        rose: {
          neon: '#E040FB',
          light: '#F060FF',
        },
        cyan: {
          neon: '#00E5FF',
          light: '#40F0FF',
        },
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        sora: ['Sora', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #7B2FBE, #E040FB)',
        'cyan-gradient': 'linear-gradient(135deg, #00E5FF, #7B2FBE)',
        'dark-card': 'linear-gradient(135deg, #1a0a2e 0%, #0D0D1A 50%, #0a1a2e 100%)',
      },
      boxShadow: {
        neon: '0 0 20px rgba(123, 47, 190, 0.5)',
        'neon-rose': '0 0 20px rgba(224, 64, 251, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.5)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        ticker: 'ticker 30s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(123, 47, 190, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(123, 47, 190, 0.8)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
