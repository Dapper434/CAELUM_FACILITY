import { courierStatusLabel } from '../utils/transferStatus';
import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { RECEIPT_CONDITIONS } from '../utils/constants';
import { formatDateTime } from '../utils/format';
import { Button, ErrorBanner, Loading } from './ui';

export const SEAL_CHECK_STAGES = ['in_transit', 'arrived', 'delivered'];

/** Seal number is compared by the API; every check is logged as a custody event. */
export function SealCheck({ transferId, onChecked }) {
  const [entered, setEntered] = useState('');
  const [result, setResult] = useState(null);
  const { busy, error, run } = useAction();
  async function check(e) {
    e.preventDefault();
    setResult(null);
    const res = await run(() => transfersApi.sealCheck(transferId, entered.trim()));
    if (res) { setResult(res); onChecked?.(res); }
  }
  return (
    <form onSubmit={check}>
      <label className="label" htmlFor="seal-check">Seal number on the cooler</label>
      <ErrorBanner error={error} />
      <div className="flex flex-wrap items-center gap-2">
        <input id="seal-check" className="input font-mono max-w-xs" value={entered} onChange={(e) => { setEntered(e.target.value); setResult(null); }} placeholder="SEAL-…" required />
        <Button type="submit" variant="ghost" busy={busy} disabled={!entered.trim()}>Check seal</Button>
        {result && (result.match
          ? <span className="flex items-center gap-1 text-xs font-bold text-status-emerald"><CheckCircle2 className="w-4 h-4" /> Matches</span>
          : <span className="flex items-center gap-1 text-xs font-bold text-status-crimson"><XCircle className="w-4 h-4" /> Does not match</span>)}
      </div>
      {result && <div className="text-[11px] text-slate-400 mt-1">Checked {formatDateTime(result.checked_at)} · logged to custody</div>}
    </form>
  );
}

function DropOffCode({ transfer }) {
  const otp = useAsync(() => transfersApi.otp(transfer.id), [transfer.id]);
  if (otp.loading) return <Loading label="Loading drop-off code…" />;
  if (otp.error) return <ErrorBanner error={otp.error} />;
  return (
    <div>
      <div className="label">Drop-off code (give to the courier at handover)</div>
      <div className="font-mono text-3xl font-extrabold tracking-[0.3em] text-brand-navy" data-testid="otp">{otp.data.otp_code}</div>
      <div className="text-xs text-slate-500">Valid until {formatDateTime(otp.data.expires_at)}</div>
    </div>
  );
}

function ConfirmReceipt({ transfer, onDone }) {
  const [condition, setCondition] = useState('ok');
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  async function submit() { if (await run(() => transfersApi.confirmReceipt(transfer.id, condition, note.trim() || undefined))) onDone(); }
  return (
    <div className="space-y-2">
      <ErrorBanner error={error} />
      <div className="flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="rc-cond">Condition</label>
          <select id="rc-cond" className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {RECEIPT_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select></div>
        <div className="flex-1 min-w-[10rem]"><label className="label" htmlFor="rc-note">Note</label>
          <input id="rc-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <Button variant="success" busy={busy} onClick={submit}>Confirm receipt</Button>
      </div>
    </div>
  );
}

export default function RecipientCustodyPanel({ transfer, onChange }) {
  const { stage } = transfer;
  return (
    <div className="space-y-4">
      {['packed', 'courier_assigned', 'in_transit', 'arrived'].includes(stage) && <DropOffCode transfer={transfer} />}
      {SEAL_CHECK_STAGES.includes(stage) && <SealCheck transferId={transfer.id} onChecked={onChange} />}
      {stage === 'delivered' && !transfer.received_confirmed_at && <ConfirmReceipt transfer={transfer} onDone={onChange} />}
      {transfer.received_confirmed_at && (
        <p className="text-sm text-status-emerald font-semibold">Receipt confirmed {formatDateTime(transfer.received_confirmed_at)} · {transfer.receipt_condition}</p>
      )}
      {stage === 'courier_assigned' && <p className="text-sm text-slate-600">{courierStatusLabel(transfer)}.</p>}
      {stage === 'accepted' && <p className="text-sm text-slate-600">The donor is packing. The drop-off code appears once the cooler is sealed.</p>}
    </div>
  );
}
