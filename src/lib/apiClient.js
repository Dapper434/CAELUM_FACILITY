import { config } from './config';
import { createHttpClient } from './http';
import { getAccessToken } from './supabase';

export const http = createHttpClient({ baseUrl: config.apiBaseUrl, getToken: getAccessToken });
