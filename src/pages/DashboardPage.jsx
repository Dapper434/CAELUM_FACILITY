import React from 'react';
import { Link } from 'react-router-dom';
import { forecastApi } from '../api/forecast';
import { offersApi } from '../api/offers';
import { requestsApi } from '../api/requests';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui';

function Stat({ to, label, value, tone = 'text-slate-900' }) {
  return (
    <Link to={to} className="card p-4 hover:shadow-card-hover transition">
      <div className="label">{label}</div>
      <div className={`text-3xl font-extrabold ${tone}`}>{value ?? '—'}</div>
    </Link>
  );
}

export default function DashboardPage() {
  const { facility } = useAuth();
  const s = useAsync(async () => {
    const settle = (p) => p.then((v) => v, () => null);
    const [alerts, incoming, suggested, open, transfers] = await Promise.all([
      settle(forecastApi.alerts()),
      settle(offersApi.list('incoming')),
      settle(requestsApi.list('suggested')),
      settle(requestsApi.list('open')),
      settle(transfersApi.list({ active: 'true' })),
    ]);
    return {
      alerts: alerts?.length,
      incoming: incoming?.filter((o) => ['pending', 'held'].includes(o.status)).length,
      suggested: suggested?.length,
      open: open?.length,
      transfers: transfers?.length,
    };
  }, [], { interval: 30000 });
  const d = s.data || {};
  return (
    <div>
      <PageHeader title={facility?.name || 'Overview'} subtitle={facility ? `${facility.county} · MFL ${facility.mfl_code}` : 'Hospital overview'} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat to="/forecast" label="Open alerts" value={d.alerts} tone="text-status-crimson" />
        <Stat to="/forecast" label="Suggested requests" value={d.suggested} tone="text-accent-yellow" />
        <Stat to="/requests" label="Open requests" value={d.open} tone="text-brand-cobalt" />
        <Stat to="/offers" label="Offers to answer" value={d.incoming} tone="text-brand-burgundy" />
        <Stat to="/transfers" label="Active transfers" value={d.transfers} />
      </div>
    </div>
  );
}
