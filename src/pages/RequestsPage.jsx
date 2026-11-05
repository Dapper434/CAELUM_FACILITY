import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import NewRequestForm from '../components/NewRequestForm';
import ResponsiveTable from '../components/ResponsiveTable';
import { formatDateTime } from '../utils/format';

const FILTERS = ['', 'suggested', 'open', 'offered', 'matched', 'fulfilled', 'cancelled', 'dismissed'];

export default function RequestsPage() {
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();
  const { data, error, loading } = useAsync(() => requestsApi.list(status), [status], { interval: 30000 });
  const rows = data || [];
  const columns = [
    { header: 'Code', className: 'font-mono text-xs', cell: (r) => <Link className="text-brand-cobalt font-semibold" to={`/requests/${r.id}`}>{r.request_code}</Link> },
    { header: 'Group', className: 'font-bold', cell: (r) => r.blood_group },
    { header: 'Units', cell: (r) => r.units_requested },
    { header: 'Urgency', cell: (r) => <StatusBadge value={r.urgency} /> },
    { header: 'Status', cell: (r) => (<><StatusBadge value={r.status} />{r.source === 'forecast' && <span className="ml-1 text-[10px] text-slate-400">forecast</span>}</>) },
    { header: 'Created', className: 'whitespace-nowrap', cell: (r) => formatDateTime(r.created_at) },
  ];
  return (
    <div>
      <PageHeader title="Blood requests" subtitle="Requests this facility has raised as recipient"
        actions={<Button onClick={() => setShowNew((v) => !v)}>{showNew ? 'Close' : 'New request'}</Button>} />
      {showNew && <NewRequestForm onCreated={(r) => navigate(`/requests/${r.id}`)} />}
      <Card>
        <div className="mb-3 w-full max-w-xs">
          <label className="label" htmlFor="rq-status">Status</label>
          <select id="rq-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {FILTERS.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
          </select>
        </div>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : (
          <ResponsiveTable
            aria-label="Blood requests"
            rows={rows}
            columns={columns}
            empty={<Empty>No requests.</Empty>}
            card={(r) => (
              <Link to={`/requests/${r.id}`} className="block space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-brand-cobalt">{r.request_code}</span>
                  <StatusBadge value={r.status} />
                </div>
                <div className="text-sm"><span className="font-bold">{r.blood_group}</span> · {r.units_requested} units · <StatusBadge value={r.urgency} /></div>
                <div className="text-xs text-slate-500">{formatDateTime(r.created_at)}{r.source === 'forecast' ? ' · forecast' : ''}</div>
              </Link>
            )}
          />
        )}
      </Card>
    </div>
  );
}
