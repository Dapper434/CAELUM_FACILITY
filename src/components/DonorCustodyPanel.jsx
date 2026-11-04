import { courierAcceptedAt, courierStatusLabel } from '../utils/transferStatus';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { transfersApi } from '../api/transfers';
import { useCountdown } from '../hooks/useCountdown';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, ErrorBanner, Loading } from './ui';
import Countdown from './Countdown';
import { formatDateTime, humanize } from '../utils/format';

function PackForm({ transfer, onDone }) {
  const reserved = (transfer.units || []).map((u) => u.unit_code);
  const [seal, setSeal] = useState('');
  const [cooler, setCooler] = useState('');
  const [codes, setCodes] = useState(reserved.join('\n'));
  const [temp, setTemp] = useState('');
  const { busy, error, run } = useAction();

  async function submit(e) {
    e.preventDefault();
    const body = {
      seal_number: seal.trim(),
      cooler_id: cooler.trim(),
      unit_codes: codes.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean),
    };
    if (temp !== '') body.temperature_c = Number(temp);
    if (await run(() => transfersApi.pack(transfer.id, body))) onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-600">Scan or type every reserved unit, seal the cooler and record the seal number. <Countdown until={transfer.pack_deadline} label="Pack within" /></p>
      <ErrorBanner error={error} />
      <div className="grid sm:grid-cols-3 gap-3">
        <div><label className="label" htmlFor="pk-seal">Seal number</label><input id="pk-seal" className="input" value={seal} onChange={(e) => setSeal(e.target.value)} required /></div>
        <div><label className="label" htmlFor="pk-cooler">Cooler ID</label><input id="pk-cooler" className="input" value={cooler} onChange={(e) => setCooler(e.target.value)} required /></div>
        <div><label className="label" htmlFor="pk-temp">Temp °C</label><input id="pk-temp" type="number" step="0.1" className="input" value={temp} onChange={(e) => setTemp(e.target.value)} /></div>
      </div>
      <div><label className="label" htmlFor="pk-codes">Scanned unit codes</label>
        <textarea id="pk-codes" rows={3} className="input font-mono text-xs" value={codes} onChange={(e) => setCodes(e.target.value)} /></div>
      <Button type="submit" busy={busy}>Pack & seal</Button>
    </form>
  );
}

function suggestionLabel(c) {
  const parts = [];
  if (c.distance_km != null) parts.push(`${Math.round(c.distance_km * 10) / 10} km`);
  if (c.eta_minutes != null) parts.push(`~${c.eta_minutes} min`);
  parts.push('free');
  return parts.join(', ');
}

/** Why the last courier is no longer on this transfer (timed out or declined), or null for a first assignment. */
export function lastCourierMiss(transfer) {
  const attempts = transfer.courier_attempts || [];
  const last = attempts[attempts.length - 1];
  if (transfer.courier_timed_out_at && (!last || last.outcome === 'timed_out')) return { outcome: 'timed_out', ...(last || {}) };
  if (last) return last;
  if (transfer.last_declined_courier_id) return { outcome: 'declined', courier_id: transfer.last_declined_courier_id, reason_code: transfer.courier_decline_reason };
  return null;
}

export function AssignCourier({ transfer, onDone }) {
  const attemptsKey = (transfer.courier_attempts || []).length;
  const sugs = useAsync(() => transfersApi.courierSuggestions(transfer.id), [transfer.id, attemptsKey, transfer.courier_timed_out_at]);
  const [busyId, setBusyId] = useState('');
  const { error, run } = useAction();
  async function assign(id) {
    setBusyId(id);
    const ok = await run(() => transfersApi.assignCourier(transfer.id, id));
    setBusyId('');
    if (ok) onDone(); else sugs.reload();
  }
  const miss = lastCourierMiss(transfer);
  if (sugs.loading && !sugs.data) return <Loading label="Finding the nearest free couriers…" />;
  const list = sugs.data?.suggestions || [];
  const [top, ...rest] = list;
  return (
    <div className="space-y-3" data-testid="assign-courier">
      {miss && (
        <div className="rounded-lg border border-status-crimson/40 bg-red-50 p-3 text-sm" data-testid="courier-miss">
          <strong>{miss.outcome === 'timed_out' ? 'The courier did not accept in time.' : 'The courier declined this job'}</strong>
          {miss.outcome !== 'timed_out' && miss.reason_code ? ` (${humanize(miss.reason_code)}).` : miss.outcome !== 'timed_out' ? '.' : ''}
          {' '}Pick the next courier below; couriers who already passed on this job are left out.
        </div>
      )}
      <ErrorBanner error={error || sugs.error} />
      {top ? (
        <>
          <Button busy={busyId === top.courier_id} disabled={!!busyId} onClick={() => assign(top.courier_id)}>
            {miss ? 'Reassign to' : 'Assign'} {top.full_name} ({suggestionLabel(top)})
          </Button>
          {rest.length > 0 && (
            <ul className="divide-y divide-border-warm border border-border-warm rounded-lg" data-testid="courier-list">
              {rest.map((c) => (
                <li key={c.courier_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span>{c.full_name} · {humanize(c.vehicle_type)} · {suggestionLabel(c)}{c.same_region ? '' : ' · other region'}{c.training_certified ? '' : ' · not certified'}{c.location_source === 'home_facility' ? ' · from home base' : ''}</span>
                  <Button variant="ghost" busy={busyId === c.courier_id} disabled={!!busyId} onClick={() => assign(c.courier_id)}>Assign</Button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="text-sm text-slate-600">No free courier right now. <Button variant="ghost" onClick={sugs.reload}>Check again</Button></div>
      )}
    </div>
  );
}

/** When the courier's accept deadline passes, refetch (the API sweeps the timeout on read) until the stage changes. */
export function useRefetchOnExpiry(deadline, active, onExpire) {
  const ms = useCountdown(active ? deadline : null);
  const fired = useRef(0);
  useEffect(() => { fired.current = 0; }, [deadline]);
  useEffect(() => {
    if (!active || !deadline || ms > 0 || fired.current >= 5) return undefined;
    const t = setTimeout(() => { fired.current += 1; onExpire(); }, fired.current === 0 ? 500 : 3000);
    return () => clearTimeout(t);
  });
}

export const QR_REFRESH_STAGES = ['packed', 'courier_assigned'];

export function QrDisplay({ transfer }) {
  const qr = useAsync(() => transfersApi.qr(transfer.id), [transfer.id, transfer.seal_number]);
  const regen = useAction();
  const canRefresh = QR_REFRESH_STAGES.includes(transfer.stage);

  async function regenerate() {
    const fresh = await regen.run(() => transfersApi.qr(transfer.id, { refresh: true }));
    if (fresh) qr.setData(fresh);
  }

  if (qr.loading) return <Loading label="Loading QR…" />;
  if (qr.error && !qr.data) return <ErrorBanner error={qr.error} />;
  const d = qr.data;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className={`bg-white p-3 rounded-xl border border-border-warm ${d.expired ? 'opacity-30' : ''}`}>
        <QRCodeSVG value={d.qr_payload} size={168} data-testid="qr" />
      </div>
      <div className="text-sm space-y-1">
        <div className="label">Seal number</div>
        <div className="font-mono text-lg font-bold">{d.seal_number}</div>
        <div className="text-xs text-slate-600" data-testid="qr-expiry">
          {d.expired ? <span className="font-bold text-status-crimson">Expired {formatDateTime(d.expires_at)}</span>
            : <>Valid until {formatDateTime(d.expires_at)} · <Countdown until={d.expires_at} label="" /></>}
          {d.reissued && <span className="ml-2 text-[11px] text-slate-400">reissued</span>}
        </div>
        <ErrorBanner error={regen.error} />
        {canRefresh && (
          <Button variant="ghost" busy={regen.busy} onClick={regenerate}>Regenerate QR</Button>
        )}
        <p className="text-xs text-slate-500 max-w-xs">Show this code to the courier at pickup. They scan it in the CAELUM Courier app (Start pickup, then Scan QR) and type the seal number. After regenerating, only the newest code works.</p>
      </div>
    </div>
  );
}

export default function DonorCustodyPanel({ transfer, onChange }) {
  const { stage } = transfer;
  const waiting = stage === 'courier_assigned' && !courierAcceptedAt(transfer);
  useRefetchOnExpiry(transfer.courier_accept_deadline, waiting, onChange);
  return (
    <div className="space-y-4">
      {stage === 'accepted' && <PackForm transfer={transfer} onDone={onChange} />}
      {['packed', 'courier_assigned'].includes(stage) && <QrDisplay transfer={transfer} />}
      {stage === 'packed' && <AssignCourier transfer={transfer} onDone={onChange} />}
      {stage === 'courier_assigned' && (courierAcceptedAt(transfer)
        ? <p className="text-sm text-slate-600">{courierStatusLabel(transfer)}.</p>
        : <p className="text-sm text-slate-600">{courierStatusLabel(transfer)}. <Countdown until={transfer.courier_accept_deadline} label="Courier must accept in" /></p>)}
      {['in_transit', 'arrived', 'delivered'].includes(stage) && <p className="text-sm text-slate-600">Picked up — seal {transfer.seal_number}, cooler {transfer.cooler_id}.</p>}
    </div>
  );
}
