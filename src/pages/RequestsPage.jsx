import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import NewRequestForm from '../components/NewRequestForm';
import ResponsiveTable from '../components/ResponsiveTable';
import PageControls from '../components/PageControls';
import { formatDateTime } from '../utils/format';
import { PAGE_SIZE, clampedPage, pageParams, readPage } from '../lib/pagination';

const FILTERS = ['', 'suggested', 'open', 'offered', 'matched', 'fulfilled', 'cancelled', 'dismissed'];

export default function RequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();
  const { data, error, loading } = useAsync(async () => {
    const raw = await requestsApi.list({ status, ...pageParams(page) });
    const parsed = readPage(raw, { page });
    const next = clampedPage(page, parsed.total, parsed.page_size);
    if (next !== page) setPage(next);
    return parsed;
  }, [status, page], { interval: 30000 });
  const changeStatus = (value) => { setStatus(value); setPage(1); };
  const pageData = readPage(data);
  const rows = pageData.items;
  const columns = [
    { header: 'Code', className: 'font-mono text-xs', cell: (r) => <Link className="text-brand-cobalt font-semibold" to={`/requests/${r.id}`}>{r.request_code}</Link> },
    { header: 'Group', className: 'font-bold', cell: (r) => r.blood_group },
    { header: 'Units', cell: (r) => r.units_requested },
    { header: 'Urgency', cell: (r) => <StatusBadge value={r.urgency} /> },
    { header: 'Status', cell: (r) => (<><StatusBadge value={r.status} />{r.source === 'forecast' && <span className="ml-1 text-xs text-slate-600">forecast</span>}</>) },
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
          <select id="rq-status" className="input" value={status} onChange={(e) => changeStatus(e.target.value)}>
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
                <div className="text-xs text-slate-600">{formatDateTime(r.created_at)}{r.source === 'forecast' ? ' · forecast' : ''}</div>
              </Link>
            )}
          />
        )}
        {!loading && data && (
          <PageControls
            page={pageData.page}
            pageSize={pageData.page_size || PAGE_SIZE}
            total={pageData.total}
            hasMore={pageData.has_more}
            onPage={setPage}
            noun="requests"
          />
        )}
      </Card>
    </div>
  );
}
