const env = import.meta.env;

export const config = {
  apiBaseUrl: (env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, ''),
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  timeZone: 'Africa/Nairobi',
};

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
