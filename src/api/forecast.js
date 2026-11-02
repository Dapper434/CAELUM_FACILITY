import { http } from '../lib/apiClient';

export const forecastApi = {
  get: (params) => http.get('/forecast', params),
  run: () => http.post('/forecast/run', {}),
  alerts: () => http.get('/alerts'),
};
