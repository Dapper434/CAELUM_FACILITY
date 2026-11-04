import { http } from '../lib/apiClient';
import { assertBloodGroup } from '../utils/bloodGroup';

export const requestsApi = {
  list: (status) => http.get('/requests', { status }),
  get: (id) => http.get(`/requests/${id}`),
  create: async (body) => { assertBloodGroup(body?.blood_group); return http.post('/requests', body); },
  confirm: (id, body = {}) => http.post(`/requests/${id}/confirm`, body),
  dismiss: (id, reason) => http.post(`/requests/${id}/dismiss`, reason ? { reason } : {}),
  cancel: (id, reason) => http.post(`/requests/${id}/cancel`, reason ? { reason } : {}),
  candidates: (id) => http.get(`/requests/${id}/candidates`),
  sendOffer: (id, donorFacilityId) => http.post(`/requests/${id}/offers`, { donor_facility_id: donorFacilityId }),
};
