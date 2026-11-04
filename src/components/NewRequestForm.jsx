import React, { useState } from 'react';
import { requestsApi } from '../api/requests';
import { useAction } from '../hooks/useAction';
import { BLOOD_GROUPS, PRODUCTS, URGENCIES } from '../utils/constants';
import { Button, Card, ErrorBanner } from './ui';
import { isValidBloodGroup, PICK_BLOOD_GROUP } from '../utils/bloodGroup';

export function toRequestPayload(form) {
  const body = {
    blood_group: form.blood_group,
    units_requested: Number(form.units_requested),
    product_type: form.product_type,
    urgency: form.urgency,
  };
  if (form.reason.trim()) body.reason = form.reason.trim();
  if (form.patient_ref.trim()) body.patient_ref = form.patient_ref.trim();
  if (form.needed_by) body.needed_by = new Date(form.needed_by).toISOString();
  return body;
}

export default function NewRequestForm({ onCreated }) {
  const [form, setForm] = useState({ blood_group: '', units_requested: 2, product_type: 'packed_rbc', urgency: 'urgent', reason: '', patient_ref: '', needed_by: '' });
  const { busy, error, run } = useAction();
  const [groupError, setGroupError] = useState(null);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); if (k === 'blood_group') setGroupError(null); };

  async function submit(e) {
    e.preventDefault();
    if (!isValidBloodGroup(form.blood_group)) { setGroupError(PICK_BLOOD_GROUP); return; }
    const created = await run(() => requestsApi.create(toRequestPayload(form)));
    if (created) onCreated?.(created);
  }

  return (
    <Card title="New blood request" className="mb-4">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div><label className="label" htmlFor="nr-group">Blood group</label>
          <select id="nr-group" className="input" value={form.blood_group} onChange={set('blood_group')} aria-invalid={Boolean(groupError)}>
            <option value="">Select…</option>
            {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          {groupError && <p className="text-xs text-status-crimson mt-1">{groupError}</p>}</div>
        <div><label className="label" htmlFor="nr-units">Units</label>
          <input id="nr-units" type="number" min="1" className="input" value={form.units_requested} onChange={set('units_requested')} required /></div>
        <div><label className="label" htmlFor="nr-product">Product</label>
          <select id="nr-product" className="input" value={form.product_type} onChange={set('product_type')}>{PRODUCTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
        <div><label className="label" htmlFor="nr-urgency">Urgency</label>
          <select id="nr-urgency" className="input" value={form.urgency} onChange={set('urgency')}>{URGENCIES.map((u) => <option key={u}>{u}</option>)}</select></div>
        <div className="col-span-2"><label className="label" htmlFor="nr-reason">Reason</label>
          <input id="nr-reason" className="input" value={form.reason} onChange={set('reason')} placeholder="e.g. PPH" /></div>
        <div><label className="label" htmlFor="nr-patient">Patient ref</label>
          <input id="nr-patient" className="input" value={form.patient_ref} onChange={set('patient_ref')} /></div>
        <div><label className="label" htmlFor="nr-needed">Needed by</label>
          <input id="nr-needed" type="datetime-local" className="input" value={form.needed_by} onChange={set('needed_by')} /></div>
        <Button type="submit" busy={busy} className="col-span-2 md:col-span-1">Create request</Button>
      </form>
    </Card>
  );
}
