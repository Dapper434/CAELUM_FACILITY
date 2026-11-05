import { http } from '../lib/apiClient';
import { config } from '../lib/config';
import { getAccessToken } from '../lib/supabase';

export function facilityAuditQuery({
  limit = 50, beforeSeq, important, action, actorRole, entityType, entityId, q, window, from, to,
} = {}) {
  return {
    limit,
    before_seq: beforeSeq,
    important: important ? 1 : undefined,
    action,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId,
    q,
    window,
    from,
    to,
  };
}

export const facilitiesApi = {
  list: (params) => http.get('/facilities', params),
  get: (id) => http.get(`/facilities/${id}`),
  updateContact: (id, body) => http.patch(`/facilities/${id}`, body),
  audit: (id, opts = {}) =>
    http.get(`/facilities/${id}/audit`, facilityAuditQuery(opts), { withMeta: true }),
  auditSummary: (id, opts = {}) =>
    http.get(`/facilities/${id}/audit/summary`, { window: opts.window || '7d' }),
  async auditExport(id, opts = {}) {
    const access = await getAccessToken();
    const qs = new URLSearchParams();
    Object.entries(facilityAuditQuery({ ...opts, limit: opts.limit || 2000 })).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      qs.set(k, String(v));
    });
    const res = await fetch(`${config.apiBaseUrl}/facilities/${id}/audit/export?${qs}`, {
      headers: access ? { Authorization: `Bearer ${access}` } : {},
    });
    if (!res.ok) {
      let message = `Export failed (${res.status})`;
      try { message = (await res.json())?.error?.message || message; } catch { /* ignore */ }
      throw new Error(message);
    }
    return res.blob();
  },
};
