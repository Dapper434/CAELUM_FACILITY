import React, { useState } from 'react';
import { Link } from 'react-router';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import ResponsiveTable from '../components/ResponsiveTable';
import { formatDateTime, formatTemp, humanize } from '../utils/format';
import { transferRole } from '../utils/roles';
import { courierStatusLabel, transferPollInterval } from '../utils/transferStatus';

export default function TransfersPage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { facilityId } = useAuth();
  const [interval, setPoll] = useState(0);
  const { data, error, loading } = useAsync(async () => {
    const rows = await transfersApi.list(activeOnly ? { active: 'true' } : {});
    setPoll(transferPollInterval(rows || []));
    return rows;
  }, [activeOnly], { interval });
  const rows = data || [];
  const columns = [
    { header: 'Code', className: 'font-mono text-xs', cell: (t) => <Link className="text-brand-cobalt font-semibold" to={`/transfers/${t.id}`}>{t.transfer_code}</Link> },
    { header: 'Role', cell: (t) => humanize(transferRole(t, facilityId)) || 'Unknown' },
    { header: 'Blood', className: 'font-bold', cell: (t) => `${t.quantity} × ${t.blood_group}` },
    { header: 'Stage', cell: (t) => (<><StatusBadge value={t.stage} />{courierStatusLabel(t) && <div className="text-[11px] text-slate-600 mt-0.5">{courierStatusLabel(t)}</div>}</>) },
    { header: 'Temp', className: (t) => (t.temperature_excursion ? 'text-status-crimson font-bold' : ''), cell: (t) => formatTemp(t.temperature_c) },
    { header: 'Updated', className: 'whitespace-nowrap', cell: (t) => formatDateTime(t.updated_at) },
  ];
  // className as function isn't supported — fix Temp column
  columns[4] = {
    header: 'Temp',
    cell: (t) => <span className={t.temperature_excursion ? 'text-status-crimson font-bold' : ''}>{formatTemp(t.temperature_c)}</span>,
  };
  return (
    <div>
      <PageHeader title="Transfers" subtitle="Transfers where this facility is donor or recipient" />
      <Card>
        <label className="flex items-center gap-2 text-xs font-semibold mb-3">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active only
        </label>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : (
          <ResponsiveTable
            aria-label="Transfers"
            rows={rows}
            columns={columns}
            empty={<Empty>No transfers.</Empty>}
            card={(t) => (
              <Link to={`/transfers/${t.id}`} className="block space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-brand-cobalt">{t.transfer_code}</span>
                  <StatusBadge value={t.stage} />
                </div>
                <div className="text-sm font-bold">{t.quantity} × {t.blood_group}</div>
                <div className="text-xs text-slate-600">{humanize(transferRole(t, facilityId)) || 'Unknown'} · {formatTemp(t.temperature_c)}</div>
                {courierStatusLabel(t) && <div className="text-[11px] text-slate-600">{courierStatusLabel(t)}</div>}
                <div className="text-xs text-slate-500">{formatDateTime(t.updated_at)}</div>
              </Link>
            )}
          />
        )}
      </Card>
    </div>
  );
}
