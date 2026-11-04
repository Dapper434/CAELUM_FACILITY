import { http } from '../lib/apiClient';
import { assertBloodGroup } from '../utils/bloodGroup';

export const inventoryApi = {
  list: (params) => http.get('/inventory', params),
  add: async (units) => { units.forEach((u) => assertBloodGroup(u.blood_group)); return http.post('/inventory', { units }); },
  setStatus: (unitId, status) => http.patch(`/inventory/${unitId}`, { status }),
  // Corrections need a reason and are logged as inventory.corrected in the audit trail.
  correct: (unitId, body) => http.patch(`/inventory/${unitId}`, body),
};
