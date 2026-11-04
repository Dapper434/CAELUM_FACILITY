import React, { useState } from 'react';
import { Link } from 'react-router';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatTemp, humanize } from '../utils/format';
import { transferRole } from '../utils/roles';
import { courierStatusLabel, transferPollInterval } from '../utils/transferStatus';

export default function TransfersPage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { facilityId } = useAuth();
  const [interval, setPoll] = useState(0);
  const { data, error, loading } = useAsync(async () => {
    const rows = await transfersApi.list(activeOnly ? { active: 'true' } : {});
    setPoll(transferPollInterval(rows || [])); // poll only while a row is active
    return rows;
  }, [activeOnly], { interval });
  return (
    <div>
      <PageHeader title="Transfers" subtitle="Transfers where this facility is donor or recipient" />
      <Card>
        <label className="flex items-center gap-2 text-xs font-semibold mb-3">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active only
        </label>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : (data || []).length === 0 ? <Empty>No transfers.</Empty> : (
          <table className="w-full">
            <thead><tr><th className="th">Code</th><th className="th">Role</th><th className="th">Blood</th><th className="th">Stage</th><th className="th">Temp</th><th className="th">Updated</th></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="td font-mono text-xs"><Link className="text-brand-cobalt font-semibold" to={`/transfers/${t.id}`}>{t.transfer_code}</Link></td>
                  <td className="td">{humanize(transferRole(t, facilityId)) || 'Unknown'}</td>
                  <td className="td font-bold">{t.quantity} × {t.blood_group}</td>
                  <td className="td"><StatusBadge value={t.stage} />{courierStatusLabel(t) && <div className="text-[11px] text-slate-600 mt-0.5">{courierStatusLabel(t)}</div>}</td>
                  <td className={`td ${t.temperature_excursion ? 'text-status-crimson font-bold' : ''}`}>{formatTemp(t.temperature_c)}</td>
                  <td className="td">{formatDateTime(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
