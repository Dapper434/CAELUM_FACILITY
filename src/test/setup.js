import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Node 22+ ships its own (disabled) localStorage global that shadows jsdom's; use an in-memory Storage.
function memoryStorage() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
  };
}
for (const name of ['localStorage', 'sessionStorage']) {
  let ok = false;
  try { ok = typeof globalThis[name]?.clear === 'function'; } catch { ok = false; }
  if (!ok) Object.defineProperty(globalThis, name, { configurable: true, value: memoryStorage() });
}
