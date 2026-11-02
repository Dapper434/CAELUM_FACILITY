import { http } from '../lib/apiClient';

export const forecastApi = {
  get: (params) => http.get('/forecast', params),
  history: (params) => http.get('/forecast/history', params),
  run: () => http.post('/forecast/run', {}),
  alerts: () => http.get('/alerts'),
};
