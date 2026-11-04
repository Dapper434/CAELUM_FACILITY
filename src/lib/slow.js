import { useSyncExternalStore } from 'react';

// Render free tier cold-starts: flag calls that take longer than SLOW_MS.
export const SLOW_MS = 5000;
let slowCount = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function trackSlow(promise, ms = SLOW_MS) {
  let flagged = false;
  const timer = setTimeout(() => { flagged = true; slowCount += 1; emit(); }, ms);
  const done = () => { clearTimeout(timer); if (flagged) { slowCount -= 1; emit(); } };
  Promise.resolve(promise).then(done, done);
  return promise;
}
export const isSlow = () => slowCount > 0;
export function subscribeSlow(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function useIsSlow() { return useSyncExternalStore(subscribeSlow, isSlow, isSlow); }
