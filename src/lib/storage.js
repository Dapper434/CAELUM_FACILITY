// Per-tab storage. Sessions and per-user app state live in sessionStorage so each
// browser tab can be signed in as a different hospital.

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
let fallback = null;

function usable(name) {
  try {
    const st = typeof window !== 'undefined' ? window[name] : undefined;
    if (!st) return null;
    const probe = '__caelum_probe__';
    st.setItem(probe, '1');
    st.removeItem(probe);
    return st;
  } catch {
    return null;
  }
}

/** This tab's storage (sessionStorage), or an in-memory store outside the browser. */
export function tabStorage() {
  const st = usable('sessionStorage');
  if (st) return st;
  if (!fallback) fallback = memoryStorage();
  return fallback;
}

export function keysOf(st) {
  const keys = [];
  for (let i = 0; i < st.length; i += 1) { const k = st.key(i); if (k) keys.push(k); }
  return keys;
}

export const AUTH_KEY_PREFIX = 'sb-caelum-auth-';
const TAB_ID = 'caelum-tab-id'; // deliberately outside the `caelum.` prefix so sign-out keeps it

const newId = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

/**
 * Supabase storage key for this page load. supabase-js opens a BroadcastChannel named after
 * its storageKey and relays SIGNED_OUT / TOKEN_REFRESHED to every tab on that channel. A fresh
 * key per page load keeps every tab (even a duplicated one that copied sessionStorage) on its
 * own channel; the existing session is moved to the new key so a refresh stays signed in.
 */
export function authStorageKey(st = tabStorage()) {
  const prevId = st.getItem(TAB_ID);
  const id = newId();
  const key = AUTH_KEY_PREFIX + id;
  if (prevId) {
    const prevKey = AUTH_KEY_PREFIX + prevId;
    keysOf(st).filter((k) => k === prevKey || k.startsWith(`${prevKey}-`)).forEach((k) => {
      st.setItem(key + k.slice(prevKey.length), st.getItem(k));
      st.removeItem(k);
    });
  }
  st.setItem(TAB_ID, id);
  return key;
}

const LEGACY_DONE = 'caelum-legacy-storage-cleaned-v1';
const KEEP_LOCAL = ['caelum.theme'];
const isLegacy = (k) => (/^sb-.*-auth-token/.test(k) || /^sb-.*-(code-verifier|user)$/.test(k)
  || (k.startsWith('caelum.') && !KEEP_LOCAL.includes(k)));

/** One-time removal of shared-across-tabs auth tokens and per-user keys from localStorage. */
export function cleanupLegacyStorage() {
  const ls = usable('localStorage');
  if (!ls || ls.getItem(LEGACY_DONE)) return 0;
  const doomed = keysOf(ls).filter(isLegacy);
  doomed.forEach((k) => ls.removeItem(k));
  ls.setItem(LEGACY_DONE, '1');
  return doomed.length;
}
