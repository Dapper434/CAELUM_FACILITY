import { describe, expect, it, vi, afterEach } from 'vitest';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }));
vi.mock('./supabase', () => ({ supabase: { auth: { signOut } }, getAccessToken: async () => 'tok' }));
import { handleUnauthorized } from './apiClient';
import { createHttpClient } from './http';

describe('401 redirect', () => {
  const original = window.location;
  afterEach(() => { Object.defineProperty(window, 'location', { configurable: true, value: original }); });

  it('signs out, clears the demo session and goes to /login', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { pathname: '/transfers/t1', assign } });
    sessionStorage.setItem('caelum.demo.session', '{"access_token":"x"}');
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '{"error":{"code":"unauthorized"}}' });
    const http = createHttpClient({ baseUrl: 'x', fetchImpl, onUnauthorized: handleUnauthorized });
    await expect(http.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(signOut).toHaveBeenCalled();
    expect(sessionStorage.getItem('caelum.demo.session')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does not redirect again when already on /login', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { pathname: '/login', assign } });
    await handleUnauthorized();
    expect(assign).not.toHaveBeenCalled();
  });
});
