import { describe, expect, it, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../lib/supabase', () => ({ supabase: null, getAccessToken: async () => 't' }));
vi.mock('../lib/config', () => ({ config: { apiBaseUrl: 'https://api.test/api/v1' } }));
import { forecastApi } from './forecast';
import { availabilityApi } from './availability';
import { inventoryApi } from './inventory';

const lastUrl = () => fetchMock.mock.calls.at(-1)[0];

describe('blood group query encoding', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, text: async () => '{"data":{}}' });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('encodes O+ as %2B on /forecast', async () => {
    await forecastApi.get({ blood_group: 'O+', product_type: 'packed_rbc' });
    expect(lastUrl()).toBe('https://api.test/api/v1/forecast?blood_group=O%2B&product_type=packed_rbc');
  });
  it('encodes AB+ as %2B on /forecast/history', async () => {
    await forecastApi.history({ blood_group: 'AB+', product_type: 'packed_rbc', days: 28 });
    expect(lastUrl()).toBe('https://api.test/api/v1/forecast/history?blood_group=AB%2B&product_type=packed_rbc&days=28');
  });
  it('encodes O+ on /availability', async () => {
    await availabilityApi.lookup({ blood_group: 'O+', product_type: 'platelets', emergency: false });
    expect(lastUrl()).toContain('blood_group=O%2B');
    expect(lastUrl()).not.toMatch(/blood_group=O\+/);
  });
  it('encodes O+ on /inventory filters', async () => {
    await inventoryApi.list({ blood_group: 'O+' });
    expect(lastUrl()).toBe('https://api.test/api/v1/inventory?blood_group=O%2B');
  });
  it('leaves O- unchanged', async () => {
    await forecastApi.get({ blood_group: 'O-', product_type: 'packed_rbc' });
    expect(lastUrl()).toContain('blood_group=O-&product_type=packed_rbc');
  });
});
