import React from 'react';
import { Link, useLocation, useOutletContext, useParams, useSearchParams } from 'react-router';
import { offersApi } from '../api/offers';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import OfferCard from '../components/OfferCard';
import BackToList from '../components/BackToList';
import ListDetailLayout, { selectedClass } from '../components/ListDetailLayout';
import StatusBadge from '../components/StatusBadge';
import { patchSearchParams } from '../lib/listQuery';
import { formatEta } from '../utils/format';

export function OfferDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { onChange } = useOutletContext() || {};
  const incoming = searchParams.get('direction') !== 'outgoing';
  const { data, error, loading, reload } = useAsync(() => offersApi.get(id), [id], { interval: 15000 });
  const request = useAsync(
    () => (!incoming && data?.request_id ? requestsApi.get(data.request_id) : Promise.resolve(null)),
    [incoming, data?.request_id],
  );
  if (loading) return <Loading />;
  if (!data) {
    return (
      <div>
        <ErrorBanner error={error || { message: 'Offer not found.' }} />
        <BackToList to="/offers" label="Back to donor offers" selectedId={id} className="mt-2" />
      </div>
    );
  }
  return (
    <OfferCard
      offer={data}
      incoming={incoming}
      requestBloodGroup={incoming ? undefined : request.data?.blood_group}
      onChange={() => { reload(); onChange?.(); }}
    />
  );
}

export default function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const direction = searchParams.get('direction') === 'outgoing' ? 'outgoing' : 'incoming';
  const { data, error, loading, reload } = useAsync(() => offersApi.list(direction), [direction], { interval: 15000 });
  const location = useLocation();
  const { id: openId } = useParams();
  const selectedId = openId || location.state?.selectedId;
  const setDirection = (d) => patchSearchParams(setSearchParams, { direction: d === 'incoming' ? '' : d });
  const hrefFor = (id) => ({ pathname: `/offers/${id}`, search: location.search });
  const tab = (d, label) => (
    <button type="button" onClick={() => setDirection(d)}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${direction === d ? 'bg-brand-cobalt text-white border-brand-cobalt' : 'bg-bg-inset border-border-warm'}`}>
      {label}
    </button>
  );
  const list = (
    <div>
      <PageHeader title="Donor offers" subtitle="Pending offers expire after 5 min; holds last 30 min (one extension)" />
      <div className="flex gap-2 mb-4">{tab('incoming', 'Incoming (we donate)')}{tab('outgoing', 'Outgoing (we receive)')}</div>
      <ErrorBanner error={error} />
      {loading ? <Loading /> : (data || []).length === 0 ? <Empty>No offers.</Empty> : (
        <div className="grid gap-3">
          {(data || []).map((o) => {
            const selected = selectedId != null && String(o.id) === String(selectedId);
            return (
              <Link
                key={o.id}
                to={hrefFor(o.id)}
                data-selected={selected ? 'true' : undefined}
                aria-current={selected ? 'true' : undefined}
                className={`block rounded-xl border border-border-warm bg-bg-surface p-4 shadow-card hover:border-[color:var(--caelum-cobalt-text)] ${selectedClass(selected)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold">{o.units_requested} × {o.blood_group}</div>
                  <StatusBadge value={o.status} />
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-[color:var(--caelum-cobalt-text)]">{o.offer_code}</span>
                  {o.distance_km != null && <> · {o.distance_km} km</>}
                  {o.eta_minutes != null && <> · ETA {formatEta(o.eta_minutes, o.eta_source)}</>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
  return <ListDetailLayout list={list} backTo="/offers" backLabel="Back to donor offers" outletContext={{ onChange: reload }} />;
}
