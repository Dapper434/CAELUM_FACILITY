import { http } from '../lib/apiClient';

export const facilitiesApi = {
  list: (params) => http.get('/facilities', params),
  get: (id) => http.get(`/facilities/${id}`),
};
