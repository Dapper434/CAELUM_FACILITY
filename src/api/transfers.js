import { http } from '../lib/apiClient';

export const transfersApi = {
  list: (params) => http.get('/transfers', params),
  get: (id) => http.get(`/transfers/${id}`),
  pack: (id, body) => http.post(`/transfers/${id}/pack`, body),
  qr: (id, { refresh = false } = {}) => http.get(`/transfers/${id}/qr`, refresh ? { refresh: 'true' } : undefined),
  otp: (id) => http.get(`/transfers/${id}/otp`),
  courierSuggestions: (id) => http.get(`/transfers/${id}/courier-suggestions`),
  assignCourier: (id, courierId) => http.post(`/transfers/${id}/assign-courier`, { courier_id: courierId }),
  confirmReceipt: (id, condition, note) =>
    http.post(`/transfers/${id}/confirm-receipt`, note ? { condition, note } : { condition }),
  cancel: (id, reason) => http.post(`/transfers/${id}/cancel`, reason ? { reason } : {}),
  sealCheck: (id, sealNumber) => http.post(`/transfers/${id}/seal-check`, { seal_number: sealNumber }),
  custody: (id) => http.get(`/transfers/${id}/custody`),
  tracking: (id) => http.get(`/transfers/${id}/tracking`),
  temperature: (id) => http.get(`/transfers/${id}/temperature`),
  audit: (id) => http.get(`/transfers/${id}/audit`),
};
