import React, { useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import BloodFilters from '../components/BloodFilters';
import AddUnitsForm from '../components/AddUnitsForm';
import CorrectUnitForm from '../components/CorrectUnitForm';
import ResponsiveTable from '../components/ResponsiveTable';
import { formatDateTime, formatTemp } from '../utils/format';
import { productLabel } from '../utils/constants';

const STATUSES = ['', 'available', 'reserved', 'in_transit', 'transferred', 'expired', 'discarded'];
const EDITABLE = ['available', 'expired', 'discarded'];

function UnitActions({ unit, busy, editing, onStatus, onToggleCorrect }) {
  if (!EDITABLE.includes(unit.status)) {
    return <span className="text-xs text-slate-400">Locked</span>;
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
      <select
        aria-label={`Status for ${unit.unit_code}`}
        className="input py-1.5 text-xs w-full sm:w-auto sm:min-w-[7.5rem]"
        value={unit.status}
        disabled={busy}
        onChange={(e) => onStatus(unit, e.target.value)}
      >
        <option value="available">available</option>
        <option value="expired">expired</option>
        <option value="discarded">discarded</option>
      </select>
      <button
        type="button"
        className="text-xs font-semibold text-brand-cobalt self-start sm:self-auto"
        onClick={() => onToggleCorrect(unit.id)}
      >
        {editing === unit.id ? 'Hide' : 'Correct'}
      </button>
    </div>
  );
}

export default function InventoryPage() {
  const [filters, setFilters] = useState({ blood_group: '', product_type: '', status: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, error, loading, reload } = useAsync(() => inventoryApi.list(filters), [JSON.stringify(filters)]);
  const action = useAction();

  async function setStatus(unit, status) {
    const ok = await action.run(() => inventoryApi.setStatus(unit.id, status));
    if (ok) reload();
  }
  const toggleCorrect = (id) => setEditing((cur) => (cur === id ? null : id));

  const units = data || [];
  const columns = [
    {
      header: 'Unit',
      className: 'font-mono text-xs',
      cell: (u) => (<><span className="break-all">{u.unit_code}</span><div className="text-slate-400">{u.lot_number}</div></>),
    },
    { header: 'Group', className: 'font-bold', cell: (u) => u.blood_group },
    { header: 'Product', cell: (u) => productLabel(u.product_type) },
    { header: 'Expiry', className: 'whitespace-nowrap', cell: (u) => formatDateTime(u.expiry_date) },
    { header: 'Temp', cell: (u) => formatTemp(u.storage_temp_c) },
    { header: 'Status', cell: (u) => <StatusBadge value={u.status} /> },
    {
      header: 'Edit',
      cell: (u) => (
        <UnitActions unit={u} busy={action.busy} editing={editing} onStatus={setStatus} onToggleCorrect={toggleCorrect} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Units held by this facility, soonest expiry first. Corrections are logged to the audit trail."
        actions={<Button onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Close' : 'Add units'}</Button>}
      />
      {showAdd && <AddUnitsForm onAdded={() => { setShowAdd(false); reload(); }} />}
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <BloodFilters value={filters} onChange={setFilters} allowAny />
          <div className="min-w-[8rem]">
            <label className="label" htmlFor="inv-status">Status</label>
            <select id="inv-status" className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
            </select>
          </div>
        </div>
        <ErrorBanner error={error || action.error} />
        {loading ? <Loading /> : (
          <ResponsiveTable
            aria-label="Inventory units"
            rows={units}
            columns={columns}
            empty={<Empty>No units match.</Empty>}
            card={(u) => (
              <div className="space-y-2" data-testid="unit-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold break-all">{u.unit_code}</div>
                    <div className="text-[11px] text-slate-500">{u.lot_number || '—'}</div>
                  </div>
                  <StatusBadge value={u.status} />
                </div>
                <div className="text-sm">
                  <span className="font-bold">{u.blood_group}</span>
                  <span className="text-slate-500"> · {productLabel(u.product_type)}</span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Expiry {formatDateTime(u.expiry_date)}</span>
                  <span>{formatTemp(u.storage_temp_c)}</span>
                </div>
                <UnitActions unit={u} busy={action.busy} editing={editing} onStatus={setStatus} onToggleCorrect={toggleCorrect} />
              </div>
            )}
            afterRow={(u) => (editing === u.id ? (
              // Desktop: full-width table row. Mobile: already inside the card list item.
              <>
                <tr className="hidden md:table-row"><td colSpan={columns.length} className="td">
                  <CorrectUnitForm unit={u} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />
                </td></tr>
                <div className="md:hidden pt-1">
                  <CorrectUnitForm unit={u} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />
                </div>
              </>
            ) : null)}
          />
        )}
      </Card>
    </div>
  );
}
