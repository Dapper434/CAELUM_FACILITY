import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const SKIP = /\.test\.(js|jsx|css)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|css)$/.test(name) && !SKIP.test(name)) out.push(p);
  }
  return out;
}

function pxOf(value, unit) {
  const n = Number(value);
  if (unit === 'px' || !unit) return n;
  if (unit === 'rem' || unit === 'em') return n * 16;
  if (unit === 'pt') return n * (96 / 72);
  return n;
}

const ARBITRARY = /text-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g;
const CSS_SIZE = /font-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em|pt)/gi;
const STYLE_SIZE = /fontSize\s*:\s*['"`]?(\d+(?:\.\d+)?)(px|rem|em)?['"`]?/g;

describe('12px type floor', () => {
  it('has no text classes or font-size declarations below 12px', () => {
    const hits = [];
    for (const file of walk(ROOT)) {
      const src = readFileSync(file, 'utf8');
      const rel = relative(ROOT, file);
      for (const re of [ARBITRARY, CSS_SIZE, STYLE_SIZE]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(src))) {
          const unit = m[2] || 'px';
          if (pxOf(m[1], unit) < 12) hits.push(`${rel}: ${m[0]}`);
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
