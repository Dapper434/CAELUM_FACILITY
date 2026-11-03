import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('vite build config', () => {
  it('does not split React into custom manual chunks', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'vite.config.js'), 'utf8');
    expect(src).not.toMatch(/manualChunks\s*:/);
  });
});
