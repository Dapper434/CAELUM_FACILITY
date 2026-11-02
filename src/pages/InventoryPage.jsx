import React, { useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import BloodFilters from '../components/BloodFilters';
import AddUnitsForm from '../components/AddUnitsForm';
import { formatDateTime, formatTemp } from '../utils/format';
import { productLabel } from '../utils/constants';

const STATUSES = ['', 'available', 'reserved', 'in_transit', 'transferred', 'expired', 'discarded'];

export default function InventoryPage() {
  const [filters, setFilters] = useState({ blood_group: '', product_type: '', status: '' });
  const [showAdd, setShowAdd] = useState(false);
  const { data, error, loading, reload } = useAsync(() => inventoryApi.list(filters), [JSON.stringify(filters)]);
  const action = useAction();

  async function setStatus(unit, status) {
    const ok = await action.run(() => inventoryApi.setStatus(unit.id, status));
    if (ok) reload();
  }

  const units = data || [];
  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Units held by this facility, soonest expiry first"
        actions={<Button onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Close' : 'Add units'}</Button>}
      />
      {showAdd && <AddUnitsForm onAdded={() => { setShowAdd(false); reload(); }} />}
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <BloodFilters value={filters} onChange={setFilters} allowAny />
          <div>
            <label className="label" htmlFor="inv-status">Status</label>
            <select id="inv-status" className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
            </select>
          </div>
        </div>
        <ErrorBanner error={error || action.error} />
        {loading ? <Loading /> : units.length === 0 ? <Empty>No units match.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="th">Unit</th><th className="th">Group</th><th className="th">Product</th>
                <th className="th">Expiry</th><th className="th">Temp</th><th className="th">Status</th><th className="th">Edit</th>
              </tr></thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td className="td font-mono text-xs">{u.unit_code}<div className="text-slate-400">{u.lot_number}</div></td>
                    <td className="td font-bold">{u.blood_group}</td>
                    <td className="td">{productLabel(u.product_type)}</td>
                    <td className="td">{formatDateTime(u.expiry_date)}</td>
                    <td className="td">{formatTemp(u.storage_temp_c)}</td>
                    <td className="td"><StatusBadge value={u.status} /></td>
                    <td className="td">
                      {['available', 'expired', 'discarded'].includes(u.status) ? (
                        <select
                          aria-label={`Status for ${u.unit_code}`}
                          className="input py-1 text-xs"
                          value={u.status}
                          disabled={action.busy}
                          onChange={(e) => setStatus(u, e.target.value)}
                        >
                          <option value="available">available</option>
                          <option value="expired">expired</option>
                          <option value="discarded">discarded</option>
                        </select>
                      ) : <span className="text-xs text-slate-400">Locked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
