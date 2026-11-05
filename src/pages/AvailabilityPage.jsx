import React, { useState } from 'react';
import { availabilityApi } from '../api/availability';
import { useAsync } from '../hooks/useAsync';
import { Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import BloodFilters from '../components/BloodFilters';
import ResponsiveTable from '../components/ResponsiveTable';
import { formatDateTime } from '../utils/format';

export default function AvailabilityPage() {
  const [filters, setFilters] = useState({ blood_group: 'O-', product_type: 'packed_rbc' });
  const [emergency, setEmergency] = useState(false);
  const { data, error, loading } = useAsync(
    () => availabilityApi.lookup({ ...filters, emergency }),
    [filters.blood_group, filters.product_type, emergency],
  );
  const rows = data || [];
  const columns = [
    { header: 'Facility', className: 'font-semibold', cell: (r) => r.facility_name },
    { header: 'County', cell: (r) => r.county },
    { header: 'Units', className: 'font-bold', cell: (r) => r.units_available },
    { header: 'Expiring ≤72h', cell: (r) => r.expiring_within_72h },
    { header: 'Earliest expiry', className: 'whitespace-nowrap', cell: (r) => formatDateTime(r.earliest_expiry) },
    { header: 'Distance', cell: (r) => (r.distance_km != null ? `${r.distance_km} km` : '—') },
  ];
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
        {loading ? <Loading /> : (
          <ResponsiveTable
            aria-label="Availability results"
            rows={rows}
            keyOf={(r) => r.facility_id}
            columns={columns}
            empty={<Empty>No stock found.</Empty>}
            card={(r) => (
              <div className="space-y-1" data-testid="availability-card">
                <div className="font-semibold text-sm">{r.facility_name}</div>
                <div className="text-xs text-slate-500">{r.county || '—'}{r.distance_km != null ? ` · ${r.distance_km} km` : ''}</div>
                <div className="text-sm"><span className="font-bold">{r.units_available}</span> units · {r.expiring_within_72h} expiring ≤72h</div>
                <div className="text-xs text-slate-600">Earliest {formatDateTime(r.earliest_expiry)}</div>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
}
