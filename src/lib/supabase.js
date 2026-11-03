import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';

/** Null when Supabase is not configured; never built from placeholder values. */
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export { isSupabaseConfigured };

export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
