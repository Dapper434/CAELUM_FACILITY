import { describe, expect, it } from 'vitest';
import { normalizeApiBase, resolveConfig } from './config';

const supa = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' };

describe('resolveConfig', () => {
  it('requires the API URL in production builds', () => {
    const c = resolveConfig({ ...supa, DEV: false });
    expect(c.errors[0]).toMatch(/VITE_API_BASE_URL/);
  });
  it('allows the localhost default only in dev', () => {
    const c = resolveConfig({ ...supa, DEV: true });
    expect(c.errors).toEqual([]);
    expect(c.apiBaseUrl).toBe('http://localhost:5000/api/v1');
  });
  it('appends /api/v1 once', () => {
    expect(normalizeApiBase('https://caelum-api.onrender.com')).toBe('https://caelum-api.onrender.com/api/v1');
    expect(normalizeApiBase('https://caelum-api.onrender.com/')).toBe('https://caelum-api.onrender.com/api/v1');
    expect(normalizeApiBase('https://caelum-api.onrender.com/api/v1')).toBe('https://caelum-api.onrender.com/api/v1');
    expect(normalizeApiBase('https://caelum-api.onrender.com/api/v1/')).toBe('https://caelum-api.onrender.com/api/v1');
  });
  it('needs the Supabase URL and publishable key', () => {
    expect(resolveConfig({ VITE_API_BASE_URL: 'a' }).errors).toHaveLength(1);
    expect(resolveConfig({ VITE_API_BASE_URL: 'a', ...supa }).errors).toEqual([]);
  });
  it('falls back to the legacy anon key name', () => {
    const c = resolveConfig({ VITE_API_BASE_URL: 'a', VITE_SUPABASE_URL: 'u', VITE_SUPABASE_ANON_KEY: 'old' });
    expect(c.errors).toEqual([]);
    expect(c.supabaseKey).toBe('old');
  });
});
