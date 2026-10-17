import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      colors: {
        // Admin portal: graphite sidebar, warm off-white canvas
        admin: {
          side: '#121a1e',
          active: '#283236',
          ink: '#16191b',
          btn: '#1f2b2e',
          page: '#f3f2ef',
          card: '#fdfcfa',
          line: '#e9e7e2',
          muted: '#7a7f82',
        },
        // Employee portal: navy sidebar, electric blue actions
        emp: {
          side: '#0f1b26',
          blue: '#1d63ed',
          page: '#f5f7fa',
          line: '#e6eaf0',
          muted: '#7b8494',
        },
        // Customer tracking: warm paper, deep teal actions
        cust: {
          page: '#f8f6f1',
          side: '#f3f1ec',
          card: '#fdfcf9',
          teal: '#1f3c3b',
          line: '#e8e4dc',
          active: '#e2ebf7',
          link: '#2a5dab',
          muted: '#7d7f80',
        },
        ok: { bg: '#dff3e8', fg: '#23824f' },
        warn: { bg: '#fdeedb', fg: '#d9822b' },
        bad: { bg: '#fde3e1', fg: '#d6403a' },
        info: { bg: '#e3edff', fg: '#2563eb' },
        violet: { bg: '#ece6fd', fg: '#7a4fe0' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.05)',
        pop: '0 8px 24px rgba(16,24,40,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
