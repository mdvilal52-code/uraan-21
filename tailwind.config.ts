import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Hover effects (lift / zoom / shadow) only apply on devices that truly
  // support hover. On touch screens a tap otherwise triggers sticky :hover,
  // promoting elements to GPU layers that smear on weak mobile GPUs — the
  // "glitch" seen while scrolling card sections.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        ivory: '#fbf8f1',
        cream: '#f8f2e6',
        bg: '#faf6ef',
        ink: '#1a1410',
        'ink-2': '#3a2f24',
        gold: {
          light: '#e8d49b',
          DEFAULT: '#b8893a',
          dark: '#7a5a1f',
        },
        rose: '#c89882',
        maroon: '#7a2e2e',
        emerald: '#3d6b5a',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        display: ['"Cinzel"', 'serif'],
        sans: ['"Jost"', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in': 'slideIn 0.8s ease-out',
        'scroll-x': 'scrollX 25s linear infinite',
        shine: 'shine 4s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        luxury: '0 12px 40px rgba(122,90,31,0.12)',
        'luxury-lg': '0 24px 60px rgba(122,90,31,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;