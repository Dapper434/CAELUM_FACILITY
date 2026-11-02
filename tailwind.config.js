/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-canvas': '#F6F3ED',
        'bg-surface': '#FFFFFF',
        'bg-inset': '#FAF7F2',
        'border-warm': '#E6DFD2',
        'brand-cobalt': '#0E3A8C',
        'brand-navy': '#092357',
        'brand-burgundy': '#7A1A2B',
        'brand-burgundy-hover': '#5E1321',
        'brand-burgundy-light': '#FDF2F4',
        'accent-yellow': '#F59E0B',
        'status-crimson': '#DC2626',
        'status-emerald': '#059669',
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
