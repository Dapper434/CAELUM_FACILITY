import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

const media = { matches: true, listeners: new Set() };

/** Test helper: set whether `(min-width: 768px)` matches (desktop = true). */
export function setMatchMedia(matches) {
  media.matches = Boolean(matches);
  media.listeners.forEach((fn) => fn({ matches: media.matches, media: '(min-width: 768px)' }));
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query) => ({
      get matches() { return media.matches; },
      media: query,
      addEventListener: (ev, fn) => { if (ev === 'change') media.listeners.add(fn); },
      removeEventListener: (_ev, fn) => media.listeners.delete(fn),
      addListener: (fn) => media.listeners.add(fn),
      removeListener: (fn) => media.listeners.delete(fn),
      dispatchEvent: () => true,
    }),
  });
}

afterEach(() => {
  cleanup();
  media.listeners.clear();
  media.matches = true;
});


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
