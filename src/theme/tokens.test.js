import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('text tokens', () => {
  const config = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');

  it('defines the darker status text tokens for the later shared swap', () => {
    expect(config).toMatch(/['"]amber-text['"]\s*:\s*['"]#92400E['"]/);
    expect(config).toMatch(/['"]emerald-text['"]\s*:\s*['"]#047857['"]/);
    expect(config).toMatch(/['"]crimson-text['"]\s*:\s*['"]#B91C1C['"]/);
  });
});
