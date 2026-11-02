import React, { useState } from 'react';
import { offersApi } from '../api/offers';
import { useAsync } from '../hooks/useAsync';
import { Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import OfferCard from '../components/OfferCard';

export default function OffersPage() {
  const [direction, setDirection] = useState('incoming');
  const { data, error, loading, reload } = useAsync(() => offersApi.list(direction), [direction], { interval: 15000 });
  const tab = (d, label) => (
    <button type="button" onClick={() => setDirection(d)}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${direction === d ? 'bg-brand-cobalt text-white border-brand-cobalt' : 'bg-bg-inset border-border-warm'}`}>
      {label}
    </button>
  );
  return (
    <div>
      <PageHeader title="Donor offers" subtitle="Pending offers expire after 5 min; holds last 30 min (one extension)" />
      <div className="flex gap-2 mb-4">{tab('incoming', 'Incoming (we donate)')}{tab('outgoing', 'Outgoing (we receive)')}</div>
      <ErrorBanner error={error} />
      {loading ? <Loading /> : (data || []).length === 0 ? <Empty>No offers.</Empty> : (
        <div className="grid md:grid-cols-2 gap-3">
          {data.map((o) => <OfferCard key={o.id} offer={o} incoming={direction === 'incoming'} onChange={reload} />)}
        </div>
      )}
    </div>
  );
}
