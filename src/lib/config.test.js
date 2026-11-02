import { describe, expect, it } from 'vitest';
import { resolveConfig } from './config';

const supa = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' };

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
  it('trims trailing slashes', () => {
    expect(resolveConfig({ ...supa, VITE_API_BASE_URL: 'https://api/v1/' }).apiBaseUrl).toBe('https://api/v1');
  });
  it('needs Supabase unless demo mode is on', () => {
    expect(resolveConfig({ VITE_API_BASE_URL: 'a' }).errors).toHaveLength(1);
    expect(resolveConfig({ VITE_API_BASE_URL: 'a', VITE_DEMO_MODE: 'true' }).errors).toEqual([]);
  });
});
