import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ createClient: vi.fn(() => ({ auth: {} })) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: h.createClient }));
vi.mock('./config', () => ({ config: { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'pk' }, isSupabaseConfigured: true }));

describe('supabase client', () => {
  it('stores the session per tab in sessionStorage and detects recovery/invite links', async () => {
    localStorage.setItem('sb-x-auth-token', 'old');
    await import('./supabase');
    const opts = h.createClient.mock.calls[0][2].auth;
    expect(opts.storage).toBe(window.sessionStorage);
    expect(opts).toMatchObject({ persistSession: true, autoRefreshToken: true, detectSessionInUrl: true });
    expect(opts.storageKey).toMatch(/^sb-caelum-auth-/);
    expect(localStorage.getItem('sb-x-auth-token')).toBeNull();
  });
});
