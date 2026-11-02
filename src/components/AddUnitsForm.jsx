import React, { useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { useAction } from '../hooks/useAction';
import { BLOOD_GROUPS, PRODUCTS } from '../utils/constants';
import { Button, Card, ErrorBanner } from './ui';

const blank = { unit_code: '', lot_number: '', blood_group: 'O+', product_type: 'packed_rbc', expiry_date: '', storage_temp_c: '' };

export function toUnitPayload(row) {
  const unit = {
    unit_code: row.unit_code.trim(),
    lot_number: row.lot_number.trim(),
    blood_group: row.blood_group,
    product_type: row.product_type,
    expiry_date: new Date(row.expiry_date).toISOString(),
  };
  if (row.storage_temp_c !== '') unit.storage_temp_c = Number(row.storage_temp_c);
  return unit;
}

export default function AddUnitsForm({ onAdded }) {
  const [row, setRow] = useState(blank);
  const { busy, error, run } = useAction();
  const set = (k) => (e) => setRow({ ...row, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const res = await run(() => inventoryApi.add([toUnitPayload(row)]));
    if (res) { setRow(blank); onAdded?.(res); }
  }

  return (
    <Card title="Add unit" className="mb-4">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div><label className="label" htmlFor="au-code">Unit code</label><input id="au-code" className="input" value={row.unit_code} onChange={set('unit_code')} required /></div>
        <div><label className="label" htmlFor="au-lot">Lot</label><input id="au-lot" className="input" value={row.lot_number} onChange={set('lot_number')} required /></div>
        <div><label className="label" htmlFor="au-group">Group</label>
          <select id="au-group" className="input" value={row.blood_group} onChange={set('blood_group')}>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
        <div><label className="label" htmlFor="au-product">Product</label>
          <select id="au-product" className="input" value={row.product_type} onChange={set('product_type')}>{PRODUCTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
        <div><label className="label" htmlFor="au-exp">Expiry</label><input id="au-exp" type="datetime-local" className="input" value={row.expiry_date} onChange={set('expiry_date')} required /></div>
        <div><label className="label" htmlFor="au-temp">Temp °C</label><input id="au-temp" type="number" step="0.1" className="input" value={row.storage_temp_c} onChange={set('storage_temp_c')} /></div>
        <Button type="submit" busy={busy} className="col-span-2 md:col-span-6 md:w-40">Save unit</Button>
      </form>
    </Card>
  );
}
