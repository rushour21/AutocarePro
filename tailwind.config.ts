import type { Config } from 'tailwindcss';

// Design tokens sampled from the dashboard reference (cool grey surfaces, brick red, steel blue).
// `ivory` holds the neutral surface scale and `coral` the brand red, so class names stay stable.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // San Francisco on Apple devices, Inter everywhere else
      fontFamily: { sans: ['-apple-system', 'BlinkMacSystemFont', 'var(--font-inter)', 'sans-serif'] },
      colors: {
        ivory: { 50: '#fcfcfd', 100: '#f5f6f8', 200: '#e4e6ea', 300: '#e0e2e7', 400: '#d0d3d9', 500: '#b4b7bd' },
        coral: { 50: '#fbeeeb', 100: '#f8e7e4', 200: '#f1cfc7', 300: '#e6a899', 400: '#e05a35', 500: '#d84a27', 600: '#c2401f', 700: '#a23418' },
        ink: { DEFAULT: '#1d1e22', 800: '#25262b', 700: '#3a3d44', 600: '#555860', 500: '#6f737b', 400: '#92959c', 300: '#b4b7bd', 200: '#d8dade' },
        ok: { DEFAULT: '#248a6c', soft: '#d8efe8', strong: '#1a6f56' },
        warn: { DEFAULT: '#c9a24a', soft: '#f4edd8', strong: '#86661a' },
        bad: { DEFAULT: '#d84a27', soft: '#f8e7e4', strong: '#b93a1c' },
        info: { DEFAULT: '#5f8fb8', soft: '#e3edf5', strong: '#3f6f99' },
        violet: { DEFAULT: '#7d86b5', soft: '#e6e8f2', strong: '#565f94' },
      },
      boxShadow: {
        neu: '0 0 0 0.5px rgba(29,30,34,0.05), 0 8px 24px rgba(134,144,164,0.14)',
        'neu-sm': '0 0 0 0.5px rgba(29,30,34,0.05), 0 4px 14px rgba(134,144,164,0.14)',
        'neu-xs': '0 0 0 0.5px rgba(29,30,34,0.05), 0 1px 4px rgba(134,144,164,0.16)',
        'neu-in': 'inset 0 1px 3px rgba(134,144,164,0.28), inset 0 0 0 1px rgba(134,144,164,0.08)',
        'neu-in-sm': 'inset 0 1px 2px rgba(134,144,164,0.26), inset 0 0 0 1px rgba(134,144,164,0.08)',
        coral: '0 6px 14px rgba(216,74,39,0.26), inset 0 1px 0 rgba(255,255,255,0.22)',
        dark: '0 6px 14px rgba(29,30,34,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};

export default config;
