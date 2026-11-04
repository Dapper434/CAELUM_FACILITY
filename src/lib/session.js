// App-owned browser storage. Everything uses the `caelum.` prefix so sign-out can
// clear it without touching Supabase's own `sb-*` auth keys.
const PREFIX = 'caelum.';
const REDIRECT = 'caelum.redirect';
const LAST_USER = 'caelum.lastUser';
const NO_RETURN = ['/', '/login', '/reset-password'];

import { keysOf, tabStorage } from './storage';

const st = () => tabStorage();

export function getLastUser() {
  return st().getItem(LAST_USER);
}
export function setLastUser(userId) {
  if (userId) st().setItem(LAST_USER, userId);
}

/** Remember where a user was, tied to their user id. */
export function saveRedirect(userId, path) {
  if (!userId || !path || NO_RETURN.includes(path)) return;
  st().setItem(REDIRECT, JSON.stringify({ userId, path }));
}

/** The saved path, only when it belongs to `userId`. Does not consume it. */
export function redirectFor(userId) {
  try {
    const r = JSON.parse(st().getItem(REDIRECT) || 'null');
    return r && userId && r.userId === userId ? r.path : null;
  } catch {
    return null;
  }
}
export function clearRedirect() {
  st().removeItem(REDIRECT);
}

/** Removes every app-owned key from this tab's storage. `keepRedirect` keeps the user-bound return path (401 / expiry). */
export function clearUserData({ keepRedirect = false } = {}) {
  // This tab only: other tabs may be signed in as other hospitals.
  const s = st();
  keysOf(s).filter((k) => k.startsWith(PREFIX) && !(keepRedirect && k === REDIRECT)).forEach((k) => s.removeItem(k));
}
