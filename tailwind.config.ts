import type { Config } from 'tailwindcss';

// Design tokens sampled from the AutoHub reference images (warm ivory neumorphism + coral orange).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      colors: {
        ivory: { 50: '#fdfaf6', 100: '#faf4ec', 200: '#f5ece2', 300: '#eee2d4', 400: '#e2d2bf', 500: '#cdb89f' },
        coral: { 50: '#fff3ec', 100: '#ffe6d8', 200: '#ffcfb5', 300: '#ffab80', 400: '#ff8a4c', 500: '#f26a2e', 600: '#e4561b', 700: '#c04312' },
        ink: { DEFAULT: '#1c1d20', 800: '#26272b', 700: '#3b3c40', 600: '#55565a', 500: '#77746f', 400: '#928e87', 300: '#b9b3aa', 200: '#d8d1c7' },
        ok: { DEFAULT: '#1d9d65', soft: '#d9f3e5', strong: '#12834f' },
        warn: { DEFAULT: '#ee8a12', soft: '#ffe9c9', strong: '#c26a05' },
        bad: { DEFAULT: '#e5482d', soft: '#ffe1da', strong: '#c43520' },
        info: { DEFAULT: '#2f6bff', soft: '#dfe9ff', strong: '#2152d4' },
        violet: { DEFAULT: '#7456f0', soft: '#ebe3ff', strong: '#5a3fd0' },
      },
      boxShadow: {
        neu: '9px 9px 22px rgba(190,160,128,0.26), -7px -7px 18px rgba(255,255,255,0.92)',
        'neu-sm': '5px 5px 12px rgba(190,160,128,0.24), -4px -4px 10px rgba(255,255,255,0.9)',
        'neu-xs': '3px 3px 7px rgba(190,160,128,0.22), -2px -2px 6px rgba(255,255,255,0.9)',
        'neu-in': 'inset 3px 3px 8px rgba(190,160,128,0.26), inset -3px -3px 8px rgba(255,255,255,0.95)',
        'neu-in-sm': 'inset 2px 2px 5px rgba(190,160,128,0.24), inset -2px -2px 5px rgba(255,255,255,0.95)',
        coral: '0 8px 18px rgba(242,90,31,0.34), inset 0 1px 0 rgba(255,255,255,0.32)',
        dark: '0 6px 14px rgba(20,20,22,0.32), inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};

export default config;
