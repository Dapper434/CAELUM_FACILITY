import React, { useState } from 'react';
import { inventoryApi } from '../api/inventory';
import { useAction } from '../hooks/useAction';
import { Button, ErrorBanner } from './ui';

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Only changed fields plus the required reason; null when nothing changed. */
export function toCorrectionPayload(unit, form) {
  const body = {};
  if (form.lot_number.trim() !== (unit.lot_number || '')) body.lot_number = form.lot_number.trim();
  if (form.expiry_date && form.expiry_date !== toLocalInput(unit.expiry_date)) body.expiry_date = new Date(form.expiry_date).toISOString();
  const temp = form.storage_temp_c === '' ? null : Number(form.storage_temp_c);
  if (temp !== (unit.storage_temp_c ?? null)) body.storage_temp_c = temp;
  if (Object.keys(body).length === 0) return null;
  body.reason = form.reason.trim();
  return body;
}

export default function CorrectUnitForm({ unit, onDone, onCancel }) {
  const [form, setForm] = useState({
    lot_number: unit.lot_number || '',
    expiry_date: toLocalInput(unit.expiry_date),
    storage_temp_c: unit.storage_temp_c ?? '',
    reason: '',
  });
  const { busy, error, run, setError } = useAction();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const body = toCorrectionPayload(unit, form);
    if (!body) { setError({ message: 'Nothing changed.' }); return; }
    if (!body.reason) { setError({ message: 'A reason is required for corrections.' }); return; }
    if (await run(() => inventoryApi.correct(unit.id, body))) onDone?.();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end bg-bg-inset p-3 rounded-xl">
      <div className="col-span-2 md:col-span-5"><ErrorBanner error={error} /></div>
      <div><label className="label" htmlFor={`cl-${unit.id}`}>Lot</label><input id={`cl-${unit.id}`} className="input" value={form.lot_number} onChange={set('lot_number')} /></div>
      <div><label className="label" htmlFor={`ce-${unit.id}`}>Expiry</label><input id={`ce-${unit.id}`} type="datetime-local" className="input" value={form.expiry_date} onChange={set('expiry_date')} /></div>
      <div><label className="label" htmlFor={`ct-${unit.id}`}>Temp °C</label><input id={`ct-${unit.id}`} type="number" step="0.1" min="-50" max="40" className="input" value={form.storage_temp_c} onChange={set('storage_temp_c')} /></div>
      <div><label className="label" htmlFor={`cr-${unit.id}`}>Reason (required)</label><input id={`cr-${unit.id}`} className="input" value={form.reason} onChange={set('reason')} /></div>
      <div className="flex gap-2"><Button type="submit" busy={busy}>Save</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </form>
  );
}
