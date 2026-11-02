import { http } from '../lib/apiClient';

export const inventoryApi = {
  list: (params) => http.get('/inventory', params),
  add: (units) => http.post('/inventory', { units }),
  setStatus: (unitId, status) => http.patch(`/inventory/${unitId}`, { status }),
  // Corrections need a reason and are logged as inventory.corrected in the audit trail.
  correct: (unitId, body) => http.patch(`/inventory/${unitId}`, body),
};
