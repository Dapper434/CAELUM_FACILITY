import { http } from '../lib/apiClient';

export const transfersApi = {
  list: (params) => http.get('/transfers', params),
  get: (id) => http.get(`/transfers/${id}`),
  pack: (id, body) => http.post(`/transfers/${id}/pack`, body),
  qr: (id) => http.get(`/transfers/${id}/qr`),
  otp: (id) => http.get(`/transfers/${id}/otp`),
  assignCourier: (id, courierId) => http.post(`/transfers/${id}/assign-courier`, { courier_id: courierId }),
  confirmReceipt: (id, condition, note) =>
    http.post(`/transfers/${id}/confirm-receipt`, note ? { condition, note } : { condition }),
  cancel: (id, reason) => http.post(`/transfers/${id}/cancel`, reason ? { reason } : {}),
  custody: (id) => http.get(`/transfers/${id}/custody`),
  tracking: (id) => http.get(`/transfers/${id}/tracking`),
  temperature: (id) => http.get(`/transfers/${id}/temperature`),
  audit: (id) => http.get(`/transfers/${id}/audit`),
};
