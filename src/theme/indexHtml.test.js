import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('index.html head', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

  it('sets lang, title, description, theme-color and favicon links', () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toMatch(/<title>CAELUM Facility<\/title>/);
    expect(html).toMatch(/<meta name="description" content="CAELUM Facility – hospital blood-unit requests, donor offers, transfers and custody handover." \/>/);
    expect(html).toMatch(/<meta name="theme-color" content="#092357" \/>/);
    expect(html).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/favicon.svg" \/>/);
    expect(html).toMatch(/<link rel="apple-touch-icon" href="\/apple-touch-icon.png" \/>/);
  });
});
