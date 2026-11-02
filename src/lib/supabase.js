import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';

export const supabase = createClient(
  config.supabaseUrl || 'https://demo-caelum.supabase.co',
  config.supabaseAnonKey || 'demo-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export { isSupabaseConfigured };

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
