import { http } from '../lib/apiClient';

export const facilitiesApi = {
  list: (params) => http.get('/facilities', params),
  get: (id) => http.get(`/facilities/${id}`),
  audit: (id, { limit = 50, beforeSeq } = {}) =>
    http.get(`/facilities/${id}/audit`, { limit, before_seq: beforeSeq }, { withMeta: true }),
};
