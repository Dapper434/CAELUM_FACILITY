import { http } from '../lib/apiClient';

export const inventoryApi = {
  list: (params) => http.get('/inventory', params),
  add: (units) => http.post('/inventory', { units }),
  setStatus: (unitId, status) => http.patch(`/inventory/${unitId}`, { status }),
};
