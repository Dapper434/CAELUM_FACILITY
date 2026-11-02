import { http } from '../lib/apiClient';

export const couriersApi = {
  list: (status) => http.get('/couriers', { status }),
};
