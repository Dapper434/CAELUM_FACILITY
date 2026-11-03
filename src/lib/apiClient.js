import { config } from './config';
import { createHttpClient } from './http';
import { getAccessToken, supabase } from './supabase';

/** Expired or invalid token: drop the session and go to sign-in. */
export async function handleUnauthorized() {
  if (supabase) await supabase.auth.signOut();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

export const http = createHttpClient({ baseUrl: config.apiBaseUrl, getToken: getAccessToken, onUnauthorized: handleUnauthorized });
