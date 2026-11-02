import { http } from '../lib/apiClient';

// Memory-store demo mode only (contract 2.1).
export const authApi = {
  demoUsers: () => http.get('/auth/demo-users'),
  demoLogin: (login) => http.post('/auth/demo-login', { login }),
};
