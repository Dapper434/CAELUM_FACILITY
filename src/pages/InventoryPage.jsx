import React, { useState } from 'react';
import { Link, useLocation, useOutletContext, useParams, useSearchParams } from 'react-router';
import { inventoryApi } from '../api/inventory';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import BloodFilters from '../components/BloodFilters';
import AddUnitsForm from '../components/AddUnitsForm';
import CorrectUnitForm from '../components/CorrectUnitForm';
import ResponsiveTable from '../components/ResponsiveTable';
import PageControls from '../components/PageControls';
import ListDetailLayout from '../components/ListDetailLayout';
import BackToList from '../components/BackToList';
import { formatDateTime, formatTemp } from '../utils/format';
import { PAGE_SIZE, clampedPage, pageParams, readPage } from '../lib/pagination';
import { pageFromSearch, patchSearchParams } from '../lib/listQuery';
import { productLabel } from '../utils/constants';

const STATUSES = ['', 'available', 'reserved', 'in_transit', 'quarantined', 'transferred', 'expired', 'discarded'];
const EDITABLE = ['available', 'expired', 'discarded'];

function UnitActions({ unit, busy, editing, onStatus, onToggleCorrect }) {
  if (!EDITABLE.includes(unit.status)) {
    return <span className="text-xs text-slate-600">Locked</span>;
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

export function InventoryUnitPage() {
  const { id } = useParams();
  const ctx = useOutletContext() || {};
  const { units = [], loading, action, editing, setStatus, toggleCorrect, reload } = ctx;
  const unit = units.find((u) => String(u.id) === String(id));

  if (loading && !unit) return <Loading />;
  if (!unit) {
    return (
      <div>
        <Empty>This unit isn’t on the current list.</Empty>
        <BackToList to="/inventory" label="Back to inventory" selectedId={id} className="mt-2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={unit.unit_code}
        subtitle={`${unit.lot_number || 'No lot'} · ${productLabel(unit.product_type)}`}
      />
      <Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="label">Group</span><span className="font-bold">{unit.blood_group}</span></div>
          <div><span className="label">Status</span><StatusBadge value={unit.status} /></div>
          <div><span className="label">Expiry</span>{formatDateTime(unit.expiry_date)}</div>
          <div><span className="label">Temp</span>{formatTemp(unit.storage_temp_c)}</div>
        </div>
        <div className="mt-4">
          <UnitActions unit={unit} busy={action?.busy} editing={editing} onStatus={setStatus} onToggleCorrect={toggleCorrect} />
        </div>
      </Card>
      {editing === unit.id && (
        <Card title="Correct this unit">
          <CorrectUnitForm unit={unit} onCancel={() => toggleCorrect(unit.id)} onDone={() => { toggleCorrect(unit.id); reload(); }} />
        </Card>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status') || '';
  const filters = {
    blood_group: searchParams.get('blood_group') || '',
    product_type: searchParams.get('product_type') || '',
    status: STATUSES.includes(requestedStatus) ? requestedStatus : '',
  };
  const page = pageFromSearch(searchParams);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const location = useLocation();
  const { id: openId } = useParams();
  const selectedId = openId || location.state?.selectedId;
  const { data, error, loading, reload } = useAsync(async () => {
    const raw = await inventoryApi.list({ ...filters, ...pageParams(page) });
    const parsed = readPage(raw, { page });
    const next = clampedPage(page, parsed.total, parsed.page_size);
    if (next !== page) patchSearchParams(setSearchParams, { page: next });
    return parsed;
  }, [JSON.stringify(filters), page]);
  const action = useAction();
  const changeFilters = (next) => patchSearchParams(setSearchParams, { ...next, page: 1 });

  async function setStatus(unit, status) {
    const ok = await action.run(() => inventoryApi.setStatus(unit.id, status));
    if (ok) reload();
  }
  const toggleCorrect = (id) => setEditing((cur) => (cur === id ? null : id));
  const hrefFor = (id) => ({ pathname: `/inventory/${id}`, search: location.search });

  const pageData = readPage(data);
  const units = pageData.items;
  const columns = [
    {
      header: 'Unit',
      className: 'font-mono text-xs',
      cell: (u) => (
        <>
          <Link className="break-all font-semibold text-brand-cobalt" to={hrefFor(u.id)}>{u.unit_code}</Link>
          <div className="text-slate-600">{u.lot_number}</div>
        </>
      ),
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

  const list = (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Units held by this facility, soonest expiry first. Corrections are logged to the audit trail."
        actions={<Button onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Close' : 'Add units'}</Button>}
      />
      {showAdd && <AddUnitsForm onAdded={() => { setShowAdd(false); reload(); }} />}
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <BloodFilters value={filters} onChange={changeFilters} allowAny />
          <div className="min-w-[8rem]">
            <label className="label" htmlFor="inv-status">Status</label>
            <select id="inv-status" className="input" value={filters.status} onChange={(e) => changeFilters({ ...filters, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'Any'}</option>)}
            </select>
          </div>
        </div>
        <ErrorBanner error={error || action.error} />
        {loading ? <Loading /> : (
          <ResponsiveTable
            aria-label="Inventory units"
            rows={units}
            selectedKey={selectedId}
            columns={columns}
            empty={<Empty>No units match.</Empty>}
            card={(u) => (
              <div className="space-y-2" data-testid="unit-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={hrefFor(u.id)} className="font-mono text-xs font-semibold break-all text-brand-cobalt">{u.unit_code}</Link>
                    <div className="text-xs text-slate-600">{u.lot_number || '—'}</div>
                  </div>
                  <StatusBadge value={u.status} />
                </div>
                <div className="text-sm">
                  <span className="font-bold">{u.blood_group}</span>
                  <span className="text-slate-600"> · {productLabel(u.product_type)}</span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Expiry {formatDateTime(u.expiry_date)}</span>
                  <span>{formatTemp(u.storage_temp_c)}</span>
                </div>
                <UnitActions unit={u} busy={action.busy} editing={editing} onStatus={setStatus} onToggleCorrect={toggleCorrect} />
              </div>
            )}
            afterRow={(u, { surface }) => (editing === u.id ? (
              surface === 'table'
                ? <tr><td colSpan={columns.length} className="td">
                    <CorrectUnitForm unit={u} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />
                  </td></tr>
                : <div className="pt-1">
                    <CorrectUnitForm unit={u} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />
                  </div>
            ) : null)}
          />
        )}
        {!loading && data && (
          <PageControls
            page={pageData.page}
            pageSize={pageData.page_size || PAGE_SIZE}
            total={pageData.total}
            hasMore={pageData.has_more}
            onPage={(value) => patchSearchParams(setSearchParams, { page: value })}
            noun="units"
          />
        )}
      </Card>
    </div>
  );

  return (
    <ListDetailLayout
      list={list}
      backTo="/inventory"
      backLabel="Back to inventory"
      outletContext={{ units, loading, action, editing, setStatus, toggleCorrect, reload }}
    />
  );
}
