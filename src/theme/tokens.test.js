import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import tokens from './tokens.js';

const CSS_SHA = '316b49b151802e6cd3b88cca8cf06f1d63c332848423af66bf29f3cf34d4ef33';
const JS_SHA = '429df1b48c0cb4261bbeaa92f69b25c8d3c132b5ace73449e8600e236f3bf30c';

describe('shared colour tokens', () => {
  it('keeps the Admin token files verbatim', () => {
    const sha = (name) => createHash('sha256').update(readFileSync(resolve(process.cwd(), 'src/theme', name))).digest('hex');
    expect(sha('tokens.css')).toBe(CSS_SHA);
    expect(sha('tokens.js')).toBe(JS_SHA);
  });

  it('maps existing Tailwind class names to the shared tokens', async () => {
    const config = (await import(resolve(process.cwd(), 'tailwind.config.js'))).default;
    const colors = config.theme.extend.colors;
    const expected = {
      'bg-canvas': 'bg-canvas',
      'bg-surface': 'bg-surface',
      'bg-inset': 'bg-inset',
      'border-warm': 'border',
      'brand-cobalt': 'cobalt',
      'brand-navy': 'navy',
      'brand-burgundy': 'burgundy',
      'brand-burgundy-hover': 'burgundy-hover',
      'brand-burgundy-light': 'burgundy-light',
      'accent-yellow': 'amber',
      'status-crimson': 'crimson',
      'status-emerald': 'emerald',
      'amber-text': 'amber-text',
      'emerald-text': 'emerald-text',
      'crimson-text': 'crimson-text',
    };
    Object.entries(expected).forEach(([cls, token]) => {
      expect(colors[cls]).toBe(`var(--caelum-${token}, ${tokens[token]})`);
    });
    expect(tokens['amber-text']).toBe('#92400E');
    expect(tokens['emerald-text']).toBe('#047857');
    expect(tokens['crimson-text']).toBe('#B91C1C');
    expect(tokens['text-muted']).toBe('#475569');
  });
});
