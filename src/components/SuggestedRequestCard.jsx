import React, { useState } from 'react';
import { requestsApi } from '../api/requests';
import { useAction } from '../hooks/useAction';
import { URGENCIES } from '../utils/constants';
import { Button, ErrorBanner } from './ui';
import StatusBadge from './StatusBadge';

export default function SuggestedRequestCard({ request, onChange }) {
  const [units, setUnits] = useState(request.units_requested);
  const [urgency, setUrgency] = useState(request.urgency);
  const { busy, error, run } = useAction();
  const snap = request.forecast_snapshot || {};

  async function confirm() {
    const body = {};
    if (Number(units) !== request.units_requested) body.units_requested = Number(units);
    if (urgency !== request.urgency) body.urgency = urgency;
    if (await run(() => requestsApi.confirm(request.id, body))) onChange?.();
  }
  async function dismiss() {
    if (await run(() => requestsApi.dismiss(request.id, 'Not needed'))) onChange?.();
  }

  return (
    <div className="rounded-xl border border-border-warm bg-bg-inset p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold">{request.blood_group} · {request.request_code}</div>
        <StatusBadge value={request.urgency} />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        On hand {snap.units_on_hand ?? '—'} · {snap.days_of_cover ?? '—'} days of cover · avg {snap.average_daily_demand ?? '—'}/day
      </p>
      <ErrorBanner error={error} />
      <div className="flex flex-wrap items-end gap-2 mt-2">
        <div className="w-20"><label className="label" htmlFor={`u-${request.id}`}>Units</label>
          <input id={`u-${request.id}`} type="number" min="1" className="input" value={units} onChange={(e) => setUnits(e.target.value)} /></div>
        <div><label className="label" htmlFor={`g-${request.id}`}>Urgency</label>
          <select id={`g-${request.id}`} className="input" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            {URGENCIES.map((u) => <option key={u}>{u}</option>)}
          </select></div>
        <Button variant="success" busy={busy} onClick={confirm}>Confirm</Button>
        <Button variant="ghost" busy={busy} onClick={dismiss}>Dismiss</Button>
      </div>
    </div>
  );
}
