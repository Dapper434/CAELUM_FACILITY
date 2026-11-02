// Demo-mode token from POST /auth/demo-login (memory-store API only). Session-scoped.
const KEY = 'caelum.demo.session';

export function getDemoSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function getDemoToken() {
  const s = getDemoSession();
  if (!s) return null;
  if (s.expiresAt && Date.now() > s.expiresAt) { clearDemoSession(); return null; }
  return s.access_token;
}
export function setDemoSession(res) {
  sessionStorage.setItem(KEY, JSON.stringify({ access_token: res.access_token, user: res.user, expiresAt: Date.now() + (res.expires_in || 0) * 1000 }));
}
export function clearDemoSession() {
  sessionStorage.removeItem(KEY);
}
