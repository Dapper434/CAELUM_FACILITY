const DEV_API_BASE_URL = 'http://localhost:5000/api/v1';

/** Reads Vite env into app config and lists anything missing. */
export function resolveConfig(env) {
  const errors = [];
  let apiBaseUrl = String(env.VITE_API_BASE_URL || '').trim();
  if (!apiBaseUrl) {
    if (env.DEV) apiBaseUrl = DEV_API_BASE_URL;
    else errors.push('VITE_API_BASE_URL is not set.');
  }
  const supabaseUrl = String(env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY || '').trim();
  const demoMode = env.VITE_DEMO_MODE === 'true';
  if (!demoMode && (!supabaseUrl || !supabaseAnonKey)) {
    errors.push('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must both be set (or enable VITE_DEMO_MODE for a local memory-store API).');
  }
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
    supabaseUrl,
    supabaseAnonKey,
    demoMode,
    timeZone: 'Africa/Nairobi',
    errors,
  };
}

export const config = resolveConfig(import.meta.env);
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
