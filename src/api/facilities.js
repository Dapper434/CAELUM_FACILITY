import { http } from '../lib/apiClient';

export const facilitiesApi = {
  list: (params) => http.get('/facilities', params),
  get: (id) => http.get(`/facilities/${id}`),
  updateContact: (id, body) => http.patch(`/facilities/${id}`, body),
  audit: (id, { limit = 50, beforeSeq } = {}) =>
    http.get(`/facilities/${id}/audit`, { limit, before_seq: beforeSeq }, { withMeta: true }),
};
