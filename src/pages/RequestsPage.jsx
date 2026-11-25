import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import NewRequestForm from '../components/NewRequestForm';
import ResponsiveTable from '../components/ResponsiveTable';
import PageControls from '../components/PageControls';
import ListDetailLayout from '../components/ListDetailLayout';
import { formatDateTime } from '../utils/format';
import { PAGE_SIZE, clampedPage, pageParams, readPage } from '../lib/pagination';
import { pageFromSearch, patchSearchParams } from '../lib/listQuery';

const FILTERS = ['', 'suggested', 'open', 'offered', 'matched', 'fulfilled', 'cancelled', 'dismissed'];

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = pageFromSearch(searchParams);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: openId } = useParams();
  const selectedId = openId || location.state?.selectedId;
  const { data, error, loading } = useAsync(async () => {
    const raw = await requestsApi.list({ status, ...pageParams(page) });
    const parsed = readPage(raw, { page });
    const next = clampedPage(page, parsed.total, parsed.page_size);
    if (next !== page) patchSearchParams(setSearchParams, { page: next });
    return parsed;
  }, [status, page], { interval: 30000 });
  const changeStatus = (value) => patchSearchParams(setSearchParams, { status: value, page: 1 });
  const setPage = (value) => patchSearchParams(setSearchParams, { page: value });
  const hrefFor = (id) => ({ pathname: `/requests/${id}`, search: location.search });
  const pageData = readPage(data);
  const rows = pageData.items;
  const columns = [
    { header: 'Code', className: 'font-mono text-xs', cell: (r) => <Link className="text-brand-cobalt font-semibold" to={hrefFor(r.id)}>{r.request_code}</Link> },
    { header: 'Group', className: 'font-bold', cell: (r) => r.blood_group },
    { header: 'Units', cell: (r) => r.units_requested },
    { header: 'Urgency', cell: (r) => <StatusBadge value={r.urgency} /> },
    { header: 'Status', cell: (r) => (<><StatusBadge value={r.status} />{r.source === 'forecast' && <span className="ml-1 text-xs text-slate-600">forecast</span>}</>) },
    { header: 'Created', className: 'whitespace-nowrap', cell: (r) => formatDateTime(r.created_at) },
  ];
  const list = (
    <div>
      <PageHeader title="Blood requests" subtitle="Requests this facility has raised as recipient"
        actions={<Button onClick={() => setShowNew((v) => !v)}>{showNew ? 'Close' : 'New request'}</Button>} />
      {showNew && <NewRequestForm onCreated={(r) => navigate(hrefFor(r.id))} />}
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
            selectedKey={selectedId}
            columns={columns}
            empty={<Empty>No requests.</Empty>}
            card={(r) => (
              <Link to={hrefFor(r.id)} className="block space-y-1.5">
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
  return <ListDetailLayout list={list} backTo="/requests" backLabel="Back to requests" />;
}
