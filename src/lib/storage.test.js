import { describe, expect, it, beforeEach } from 'vitest';
import { AUTH_KEY_PREFIX, authStorageKey, cleanupLegacyStorage, tabStorage } from './storage';
import { setLastUser } from './session';

describe('per-tab storage', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });

  it('uses sessionStorage for per-user state', () => {
    expect(tabStorage()).toBe(window.sessionStorage);
    setLastUser('u1');
    expect(sessionStorage.getItem('caelum.lastUser')).toBe('u1');
    expect(localStorage.getItem('caelum.lastUser')).toBeNull();
  });

  it('gives each page load its own auth key but carries the session over (refresh stays signed in)', () => {
    const k1 = authStorageKey();
    expect(k1.startsWith(AUTH_KEY_PREFIX)).toBe(true);
    sessionStorage.setItem(k1, '{"session":1}');
    sessionStorage.setItem(`${k1}-code-verifier`, 'v');
    const k2 = authStorageKey();
    expect(k2).not.toBe(k1);
    expect(sessionStorage.getItem(k2)).toBe('{"session":1}');
    expect(sessionStorage.getItem(`${k2}-code-verifier`)).toBe('v');
    expect(sessionStorage.getItem(k1)).toBeNull();
  });

  it('legacy cleanup removes shared tokens and caelum.* from localStorage once, keeping unrelated keys and theme', () => {
    localStorage.setItem('sb-qvqabc-auth-token', 'tok');
    localStorage.setItem('sb-qvqabc-auth-token-code-verifier', 'v');
    localStorage.setItem('caelum.lastUser', 'u1');
    localStorage.setItem('caelum.forecastRun', 'j1');
    localStorage.setItem('caelum.theme', 'dark');
    localStorage.setItem('other-app', 'x');
    expect(cleanupLegacyStorage()).toBe(4);
    ['sb-qvqabc-auth-token', 'sb-qvqabc-auth-token-code-verifier', 'caelum.lastUser', 'caelum.forecastRun']
      .forEach((k) => expect(localStorage.getItem(k)).toBeNull());
    expect(localStorage.getItem('caelum.theme')).toBe('dark');
    expect(localStorage.getItem('other-app')).toBe('x');
    localStorage.setItem('caelum.lastUser', 'later');
    expect(cleanupLegacyStorage()).toBe(0);
    expect(localStorage.getItem('caelum.lastUser')).toBe('later');
  });
});
