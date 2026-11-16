import tokens from './src/theme/tokens.js';

/** Shared token as a CSS variable, with the light-theme hex from tokens.js as fallback. */
const caelum = (name) => `var(--caelum-${name}, ${tokens[name]})`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-canvas': caelum('bg-canvas'),
        'bg-surface': caelum('bg-surface'),
        'bg-inset': caelum('bg-inset'),
        'border-warm': caelum('border'),
        'brand-cobalt': caelum('cobalt'),
        'brand-navy': caelum('navy'),
        'brand-burgundy': caelum('burgundy'),
        'brand-burgundy-hover': caelum('burgundy-hover'),
        'brand-burgundy-light': caelum('burgundy-light'),
        'accent-yellow': caelum('amber'),
        'status-crimson': caelum('crimson'),
        'status-emerald': caelum('emerald'),
        'amber-text': caelum('amber-text'),
        'emerald-text': caelum('emerald-text'),
        'crimson-text': caelum('crimson-text'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(14, 58, 140, 0.08), 0 2px 4px -2px rgba(14, 58, 140, 0.05)',
      },
    },
  },
  plugins: [],
};
