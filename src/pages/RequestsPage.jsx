import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import NewRequestForm from '../components/NewRequestForm';
import { formatDateTime } from '../utils/format';

const FILTERS = ['', 'suggested', 'open', 'offered', 'matched', 'fulfilled', 'cancelled', 'dismissed'];

export default function RequestsPage() {
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();
  const { data, error, loading } = useAsync(() => requestsApi.list(status), [status], { interval: 30000 });
  return (
    <div>
      <PageHeader title="Blood requests" subtitle="Requests this facility has raised as recipient"
        actions={<Button onClick={() => setShowNew((v) => !v)}>{showNew ? 'Close' : 'New request'}</Button>} />
      {showNew && <NewRequestForm onCreated={(r) => navigate(`/requests/${r.id}`)} />}
      <Card>
        <div className="mb-3 w-48">
          <label className="label" htmlFor="rq-status">Status</label>
          <select id="rq-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {FILTERS.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
          </select>
        </div>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : (data || []).length === 0 ? <Empty>No requests.</Empty> : (
          <table className="w-full">
            <thead><tr><th className="th">Code</th><th className="th">Group</th><th className="th">Units</th><th className="th">Urgency</th><th className="th">Status</th><th className="th">Created</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-bg-inset">
                  <td className="td font-mono text-xs"><Link className="text-brand-cobalt font-semibold" to={`/requests/${r.id}`}>{r.request_code}</Link></td>
                  <td className="td font-bold">{r.blood_group}</td>
                  <td className="td">{r.units_requested}</td>
                  <td className="td"><StatusBadge value={r.urgency} /></td>
                  <td className="td"><StatusBadge value={r.status} />{r.source === 'forecast' && <span className="ml-1 text-[10px] text-slate-400">forecast</span>}</td>
                  <td className="td">{formatDateTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
