import { describe, expect, it, beforeEach } from 'vitest';
import { clearUserData, redirectFor, saveRedirect } from './session';

describe('session storage helpers', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });

  it('honours a deep link only for the same user', () => {
    saveRedirect('user-a', '/requests/r1');
    expect(redirectFor('user-b')).toBeNull();
    expect(redirectFor('user-a')).toBe('/requests/r1');
  });
  it('never saves a redirect without a user or for public pages', () => {
    saveRedirect(null, '/requests/r1');
    saveRedirect('user-a', '/login');
    expect(redirectFor('user-a')).toBeNull();
  });
  it('clears only this tab\'s app keys, not Supabase auth keys or localStorage', () => {
    sessionStorage.setItem('caelum.prefs', '1');
    sessionStorage.setItem('sb-caelum-auth-t1', 'x');
    localStorage.setItem('caelum.theme', 'dark');
    sessionStorage.setItem('caelum.lastUser', 'user-a');
    saveRedirect('user-a', '/transfers/t1');
    clearUserData({ keepRedirect: true });
    expect(redirectFor('user-a')).toBe('/transfers/t1');
    clearUserData();
    expect(sessionStorage.getItem('caelum.prefs')).toBeNull();
    expect(localStorage.getItem('caelum.theme')).toBe('dark');
    expect(sessionStorage.getItem('caelum.lastUser')).toBeNull();
    expect(redirectFor('user-a')).toBeNull();
    expect(sessionStorage.getItem('sb-caelum-auth-t1')).toBe('x');
  });
});
