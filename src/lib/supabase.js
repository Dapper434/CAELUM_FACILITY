import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';
import { authStorageKey, cleanupLegacyStorage, tabStorage } from './storage';

cleanupLegacyStorage();

/** Per-tab session: sessionStorage, a per-page-load key (own BroadcastChannel), URL links detected. */
export function authOptions() {
  const storage = tabStorage();
  return { storage, storageKey: authStorageKey(storage), persistSession: true, autoRefreshToken: true, detectSessionInUrl: true };
}

/** Null when Supabase is not configured; never built from placeholder values. */
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseKey, { auth: authOptions() })
  : null;

export { isSupabaseConfigured };

export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
