import { http } from '../lib/apiClient';

export const offersApi = {
  list: (direction, status) => http.get('/offers', { direction, status }),
  get: (id) => http.get(`/offers/${id}`),
  hold: (id) => http.post(`/offers/${id}/hold`, {}),
  accept: (id) => http.post(`/offers/${id}/accept`, {}),
  decline: (id, reasonCode, note) =>
    http.post(`/offers/${id}/decline`, note ? { reason_code: reasonCode, note } : { reason_code: reasonCode }),
};
