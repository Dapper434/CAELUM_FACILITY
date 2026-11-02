import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';
import { getDemoToken } from './demoSession';

/** Null when Supabase is not configured; never built from placeholder values. */
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export { isSupabaseConfigured };

export async function getAccessToken() {
  const demo = getDemoToken();
  if (demo) return demo;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
