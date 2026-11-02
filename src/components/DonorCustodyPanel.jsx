import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { transfersApi } from '../api/transfers';
import { couriersApi } from '../api/couriers';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, ErrorBanner, Loading } from './ui';
import Countdown from './Countdown';
import { humanize } from '../utils/format';

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

function AssignCourier({ transfer, onDone }) {
  const couriers = useAsync(() => couriersApi.list('available'), []);
  const [courierId, setCourierId] = useState('');
  const { busy, error, run } = useAction();
  async function assign() { if (await run(() => transfersApi.assignCourier(transfer.id, courierId))) onDone(); }
  if (couriers.loading) return <Loading label="Loading couriers…" />;
  return (
    <div className="space-y-2">
      <ErrorBanner error={error || couriers.error} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[12rem]"><label className="label" htmlFor="as-courier">Available courier</label>
          <select id="as-courier" className="input" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
            <option value="">Select…</option>
            {(couriers.data || []).map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} · {humanize(c.vehicle_type)} · box {c.cold_box_id || '—'}{c.training_certified ? '' : ' (not certified)'}</option>
            ))}
          </select></div>
        <Button busy={busy} disabled={!courierId} onClick={assign}>Assign courier</Button>
      </div>
    </div>
  );
}

function QrDisplay({ transfer }) {
  const qr = useAsync(() => transfersApi.qr(transfer.id), [transfer.id, transfer.seal_number]);
  if (qr.loading) return <Loading label="Loading QR…" />;
  if (qr.error) return <ErrorBanner error={qr.error} />;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="bg-white p-3 rounded-xl border border-border-warm"><QRCodeSVG value={qr.data.qr_payload} size={168} /></div>
      <div className="text-sm">
        <div className="label">Seal number</div>
        <div className="font-mono text-lg font-bold">{qr.data.seal_number}</div>
        <p className="text-xs text-slate-500 mt-2 max-w-xs">The courier scans this code at pickup and types the seal number.</p>
      </div>
    </div>
  );
}

export default function DonorCustodyPanel({ transfer, onChange }) {
  const { stage } = transfer;
  return (
    <div className="space-y-4">
      {stage === 'accepted' && <PackForm transfer={transfer} onDone={onChange} />}
      {['packed', 'courier_assigned'].includes(stage) && <QrDisplay transfer={transfer} />}
      {stage === 'packed' && <AssignCourier transfer={transfer} onDone={onChange} />}
      {stage === 'courier_assigned' && (
        <p className="text-sm text-slate-600">Waiting for the courier to accept the job. <Countdown until={transfer.courier_accept_deadline} label="Courier must accept in" /></p>
      )}
      {['in_transit', 'arrived', 'delivered'].includes(stage) && <p className="text-sm text-slate-600">Picked up — seal {transfer.seal_number}, cooler {transfer.cooler_id}.</p>}
    </div>
  );
}
