const DEV_API_BASE_URL = 'http://localhost:5000';
const API_PREFIX = '/api/v1';

/** Accepts the API origin with or without /api/v1 and always returns it with the prefix once. */
export function normalizeApiBase(raw) {
  const base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return base.endsWith(API_PREFIX) ? base : base + API_PREFIX;
}

/** Reads Vite env into app config and lists anything missing. */
export function resolveConfig(env) {
  const errors = [];
  let apiBaseUrl = String(env.VITE_API_BASE_URL || '').trim();
  if (!apiBaseUrl) {
    if (env.DEV) apiBaseUrl = DEV_API_BASE_URL;
    else errors.push('VITE_API_BASE_URL is not set.');
  }
  const supabaseUrl = String(env.VITE_SUPABASE_URL || '').trim();
  // VITE_SUPABASE_ANON_KEY is the legacy name, still accepted.
  const supabaseKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) {
    errors.push('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must both be set.');
  }
  return {
    apiBaseUrl: normalizeApiBase(apiBaseUrl),
    supabaseUrl,
    supabaseKey,
    timeZone: 'Africa/Nairobi',
    errors,
  };
}

export const config = resolveConfig(import.meta.env);
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey);
