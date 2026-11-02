import { describe, expect, it, vi } from 'vitest';
import { ApiError, buildQuery, createHttpClient } from './http';

function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? '' : JSON.stringify(body)) };
}

describe('http client', () => {
  it('builds query strings without empty values', () => {
    expect(buildQuery({ a: 'O-', b: '', c: null, d: undefined, e: false })).toBe('?a=O-&e=false');
    expect(buildQuery({})).toBe('');
  });

  it('sends bearer token and unwraps data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, { data: { id: 1 } }));
    const http = createHttpClient({ baseUrl: 'http://api/v1', getToken: async () => 'tok', fetchImpl });
    await expect(http.get('/me')).resolves.toEqual({ id: 1 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://api/v1/me');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.method).toBe('GET');
  });

  it('posts JSON bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(201, { data: { ok: true } }));
    const http = createHttpClient({ baseUrl: 'x', fetchImpl });
    await http.post('/requests', { blood_group: 'O-' });
    expect(fetchImpl.mock.calls[0][1].body).toBe('{"blood_group":"O-"}');
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('maps the error envelope to ApiError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(409, { error: { code: 'hold_limit', message: 'No more extensions', details: { max: 1 } } }));
    const http = createHttpClient({ baseUrl: 'x', fetchImpl });
    const err = await http.post('/offers/1/hold').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('hold_limit');
    expect(err.details).toEqual({ max: 1 });
  });

  it('reports network failures', async () => {
    const http = createHttpClient({ baseUrl: 'x', fetchImpl: vi.fn().mockRejectedValue(new TypeError('fail')) });
    await expect(http.get('/me')).rejects.toMatchObject({ code: 'network_error', status: 0 });
  });

  it('returns meta when asked', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, { data: [1, 2], meta: { count: 2 } }));
    const http = createHttpClient({ baseUrl: 'x', fetchImpl });
    await expect(http.get('/alerts', null, { withMeta: true })).resolves.toEqual({ data: [1, 2], meta: { count: 2 } });
  });
});
