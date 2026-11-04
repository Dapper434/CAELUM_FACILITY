import { http } from '../lib/apiClient';

export const forecastApi = {
  get: (params) => http.get('/forecast', params),
  history: (params) => http.get('/forecast/history', params),
  // 1.4.0: 202 (new job) or 200 (same scope already queued/running), both a ForecastRun.
  run: () => http.post('/forecast/run', {}),
  getRun: (jobId) => http.get(`/forecast/runs/${encodeURIComponent(jobId)}`),
  alerts: () => http.get('/alerts'),
};
