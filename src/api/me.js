import { http } from '../lib/apiClient';

export const meApi = {
  get: () => http.get('/me'),
  health: () => http.get('/health'),
};
