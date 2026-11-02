import { http } from '../lib/apiClient';

export const availabilityApi = {
  lookup: ({ blood_group, product_type, emergency }) =>
    http.get('/availability', { blood_group, product_type, emergency: emergency ? 'true' : 'false' }),
};
