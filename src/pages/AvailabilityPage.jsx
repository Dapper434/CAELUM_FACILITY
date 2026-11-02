import React, { useState } from 'react';
import { availabilityApi } from '../api/availability';
import { useAsync } from '../hooks/useAsync';
import { Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import BloodFilters from '../components/BloodFilters';
import { formatDateTime } from '../utils/format';

export default function AvailabilityPage() {
  const [filters, setFilters] = useState({ blood_group: 'O-', product_type: 'packed_rbc' });
  const [emergency, setEmergency] = useState(false);
  const { data, error, loading } = useAsync(
    () => availabilityApi.lookup({ ...filters, emergency }),
    [filters.blood_group, filters.product_type, emergency],
  );
  const rows = data || [];
  return (
    <div>
      <PageHeader title="Availability lookup" subtitle="Aggregated stock at facilities in your region" />
      <Card>
        <div className="flex flex-wrap items-end gap-4 mb-3">
          <BloodFilters value={filters} onChange={setFilters} />
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
            Emergency (search all regions)
          </label>
        </div>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : rows.length === 0 ? <Empty>No stock found.</Empty> : (
          <table className="w-full">
            <thead><tr>
              <th className="th">Facility</th><th className="th">County</th><th className="th">Units</th>
              <th className="th">Expiring ≤72h</th><th className="th">Earliest expiry</th><th className="th">Distance</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.facility_id}>
                  <td className="td font-semibold">{r.facility_name}</td>
                  <td className="td">{r.county}</td>
                  <td className="td font-bold">{r.units_available}</td>
                  <td className="td">{r.expiring_within_72h}</td>
                  <td className="td">{formatDateTime(r.earliest_expiry)}</td>
                  <td className="td">{r.distance_km != null ? `${r.distance_km} km` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
