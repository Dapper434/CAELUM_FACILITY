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

        // Facility dashboard design direction. Deliberately app-local: the
        // canonical tokens.js/tokens.css files are shared verbatim with the
        // Admin and Courier apps and are contract-tested.
        'clinic-navy': '#102C46',
        'clinic-navy-strong': '#0B2239',
        'clinic-teal': '#087F8C',
        'clinic-teal-hover': '#066975',
        'clinic-teal-soft': '#E7F3F4',
        'clinic-canvas': '#F5F8FA',
        'clinic-border': '#E2E8F0',
        'clinic-text': '#172B3A',
        'clinic-muted': '#64748B',
        'clinic-critical': '#D94848',
        'clinic-warning': '#E6A23C',
        'clinic-success': '#25865B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 34, 51, 0.04)',
        'card-hover': '0 6px 16px -8px rgba(15, 34, 51, 0.18), 0 2px 4px -2px rgba(15, 34, 51, 0.06)',
        panel: '0 1px 2px rgba(15, 34, 51, 0.03), 0 18px 40px -32px rgba(15, 34, 51, 0.28)',
      },
    },
  },
  plugins: [],
};
