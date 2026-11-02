import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatTemp } from '../utils/format';

export default function TransfersPage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { facilityId } = useAuth();
  const { data, error, loading } = useAsync(() => transfersApi.list(activeOnly ? { active: 'true' } : {}), [activeOnly], { interval: 20000 });
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
                  <td className="td">{t.donor_facility_id === facilityId ? 'Donor' : 'Recipient'}</td>
                  <td className="td font-bold">{t.quantity} × {t.blood_group}</td>
                  <td className="td"><StatusBadge value={t.stage} /></td>
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
