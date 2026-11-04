// App-owned browser storage. Everything uses the `caelum.` prefix so sign-out can
// clear it without touching Supabase's own `sb-*` auth keys.
const PREFIX = 'caelum.';
const REDIRECT = 'caelum.redirect';
const LAST_USER = 'caelum.lastUser';
const NO_RETURN = ['/', '/login', '/reset-password'];

const stores = () => [globalThis.sessionStorage, globalThis.localStorage].filter(Boolean);

export function getLastUser() {
  return sessionStorage.getItem(LAST_USER);
}
export function setLastUser(userId) {
  if (userId) sessionStorage.setItem(LAST_USER, userId);
}

/** Remember where a user was, tied to their user id. */
export function saveRedirect(userId, path) {
  if (!userId || !path || NO_RETURN.includes(path)) return;
  sessionStorage.setItem(REDIRECT, JSON.stringify({ userId, path }));
}

/** The saved path, only when it belongs to `userId`. Does not consume it. */
export function redirectFor(userId) {
  try {
    const r = JSON.parse(sessionStorage.getItem(REDIRECT) || 'null');
    return r && userId && r.userId === userId ? r.path : null;
  } catch {
    return null;
  }
}
export function clearRedirect() {
  sessionStorage.removeItem(REDIRECT);
}

/** Removes every app-owned key. `keepRedirect` keeps the user-bound return path (401 / expiry). */
export function clearUserData({ keepRedirect = false } = {}) {
  stores().forEach((st) => {
    const keys = [];
    for (let i = 0; i < st.length; i += 1) keys.push(st.key(i));
    keys.filter((k) => k && k.startsWith(PREFIX) && !(keepRedirect && k === REDIRECT)).forEach((k) => st.removeItem(k));
  });
}
