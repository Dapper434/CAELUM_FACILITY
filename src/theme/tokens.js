/**
 * CAELUM shared colour tokens.
 * Canonical source for the Admin, Facility and Courier apps. Copy this file
 * and tokens.css together, verbatim. Do not add app-specific imports.
 *
 * `tokens` is the light (daylight) theme. `tokensDark` holds the clinical
 * low-light values for any key that changes. Brand and status fills are
 * the same in both themes.
 */

export const palette = {
  cream: '#F6F3ED',
  cobalt: '#0E3A8C',
  navy: '#092357',
  burgundy: '#7A1A2B',
  amber: '#F59E0B',
  emerald: '#059669',
  crimson: '#DC2626',
};

export const tokens = {
  cream: '#F6F3ED',
  cobalt: '#0E3A8C',
  navy: '#092357',
  burgundy: '#7A1A2B',
  'burgundy-hover': '#5E1321',
  'burgundy-light': '#FDF2F4',
  'burgundy-dark': '#54121E',
  amber: '#F59E0B',
  emerald: '#059669',
  crimson: '#DC2626',
  'header-end': '#4A101C',
  white: '#FFFFFF',
  'text-on-accent': '#0F172A',

  'bg-canvas': '#F6F3ED',
  'bg-surface': '#FFFFFF',
  'bg-inset': '#FAF7F2',
  border: '#E6DFD2',
  text: '#1E293B',
  'text-heading': '#0F172A',
  'text-secondary': '#334155',
  'text-muted': '#475569',
  'amber-text': '#92400E',
  'emerald-text': '#047857',
  'crimson-text': '#B91C1C',
  'cobalt-text': '#0E3A8C',
  'burgundy-text': '#7A1A2B',
  'scrollbar-thumb': '#D8D0C2',
  'header-link': '#BFDBFE',

  'bg-canvas-dark': '#1E2433',
  'bg-surface-dark': '#283042',
  'bg-inset-dark': '#1A202E',
  'border-dark': '#374259',
  'cobalt-lowlight': '#2554A8',
  'burgundy-lowlight': '#9B2C42',
  'text-lowlight': '#E2E8F0',
  'text-lowlight-secondary': '#94A3B8',
};

export const tokensDark = {
  'bg-canvas': '#1E2433',
  'bg-surface': '#283042',
  'bg-inset': '#1A202E',
  border: '#374259',
  text: '#E2E8F0',
  'text-heading': '#F1F5F9',
  'text-secondary': '#CBD5E1',
  'text-muted': '#94A3B8',
  'amber-text': '#FCD34D',
  'emerald-text': '#34D399',
  'crimson-text': '#F87171',
  'cobalt-text': '#60A5FA',
  'burgundy-text': '#FDA4AF',
  'scrollbar-thumb': '#374259',
};

export default tokens;
