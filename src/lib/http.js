export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'http_error';
    this.details = details || null;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/**
 * Creates a small JSON client for the CAELUM API envelope:
 * success `{data, meta?}`, error `{error: {code, message, details}}`.
 */
export function createHttpClient({ baseUrl, getToken, fetchImpl, onUnauthorized }) {
  const doFetch = fetchImpl || ((...a) => globalThis.fetch(...a));

  async function request(method, path, { params, body, withMeta } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken ? await getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await doFetch(`${baseUrl}${path}${buildQuery(params)}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new ApiError(0, 'network_error', 'Cannot reach the CAELUM API');
    }

    let json = null;
    const text = await res.text();
    if (text) {
      try { json = JSON.parse(text); } catch { json = null; }
    }
    if (!res.ok) {
      const e = json?.error || {};
      if (res.status === 401 && onUnauthorized) {
        try { await onUnauthorized(); } catch { /* still surface the error */ }
      }
      throw new ApiError(res.status, e.code, e.message, e.details);
    }
    if (withMeta) return { data: json?.data, meta: json?.meta || {} };
    return json?.data;
  }

  return {
    get: (path, params, opts) => request('GET', path, { params, ...opts }),
    post: (path, body = {}, opts) => request('POST', path, { body, ...opts }),
    patch: (path, body = {}, opts) => request('PATCH', path, { body, ...opts }),
  };
}

export { buildQuery };
