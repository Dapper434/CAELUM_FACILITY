import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { RECEIPT_CONDITIONS } from '../utils/constants';
import { sealMatches } from '../utils/custody';
import { formatDateTime } from '../utils/format';
import { Button, ErrorBanner, Loading } from './ui';

export function SealCheck({ expected }) {
  const [entered, setEntered] = useState('');
  const ok = sealMatches(expected, entered);
  return (
    <div>
      <label className="label" htmlFor="seal-check">Seal number on the cooler</label>
      <div className="flex items-center gap-2">
        <input id="seal-check" className="input font-mono" value={entered} onChange={(e) => setEntered(e.target.value)} placeholder="SEAL-…" />
        {entered && (ok
          ? <span className="flex items-center gap-1 text-xs font-bold text-status-emerald"><CheckCircle2 className="w-4 h-4" /> Matches</span>
          : <span className="flex items-center gap-1 text-xs font-bold text-status-crimson"><XCircle className="w-4 h-4" /> Does not match</span>)}
      </div>
    </div>
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
  const sealed = ['packed', 'courier_assigned', 'in_transit', 'arrived', 'delivered'].includes(stage);
  return (
    <div className="space-y-4">
      {['packed', 'courier_assigned', 'in_transit', 'arrived'].includes(stage) && <DropOffCode transfer={transfer} />}
      {sealed && transfer.seal_number && <SealCheck expected={transfer.seal_number} />}
      {stage === 'delivered' && !transfer.received_confirmed_at && <ConfirmReceipt transfer={transfer} onDone={onChange} />}
      {transfer.received_confirmed_at && (
        <p className="text-sm text-status-emerald font-semibold">Receipt confirmed {formatDateTime(transfer.received_confirmed_at)} · {transfer.receipt_condition}</p>
      )}
      {stage === 'accepted' && <p className="text-sm text-slate-600">The donor is packing. The drop-off code appears once the cooler is sealed.</p>}
    </div>
  );
}
