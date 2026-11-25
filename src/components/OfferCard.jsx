import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { offersApi } from '../api/offers';
import { useAction } from '../hooks/useAction';
import { DECLINE_REASONS, productLabel } from '../utils/constants';
import { formatDateTime, formatEta } from '../utils/format';
import { deriveRecipientOfferFallback } from '../lib/candidateAdapter';
import { Button, ErrorBanner } from './ui';
import StatusBadge from './StatusBadge';
import Countdown from './Countdown';

export default function OfferCard({ offer, incoming, onChange, requestBloodGroup, postResponse }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('insufficient_stock');
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  const navigate = useNavigate();
  const live = ['pending', 'held'].includes(offer.status);
  const display = incoming
    ? { label: null, warnings: [] }
    : deriveRecipientOfferFallback({ offer, requestBloodGroup, postResponse });

  async function hold() { if (await run(() => offersApi.hold(offer.id))) onChange?.(); }
  async function accept() {
    const res = await run(() => offersApi.accept(offer.id));
    if (res?.transfer?.id) navigate(`/transfers/${res.transfer.id}`); else if (res) onChange?.();
  }
  async function decline() {
    if (await run(() => offersApi.decline(offer.id, reason, note.trim() || undefined))) { setDeclining(false); onChange?.(); }
  }

  return (
    <div className="rounded-xl border border-border-warm bg-bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[color:var(--caelum-text-heading)]">
          <span>
            {offer.units_requested} × {offer.blood_group}{' '}
            <span className="font-normal text-[color:var(--caelum-text-muted)]">{productLabel(offer.product_type)}</span>
          </span>
          {display.label && (
            <span
              data-testid="offer-fallback-label"
              className="inline-flex items-center rounded-full border border-[color:var(--caelum-amber-text)]/40 bg-bg-inset px-2 py-0.5 text-xs font-semibold text-[color:var(--caelum-amber-text)]"
            >
              {display.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2"><StatusBadge value={offer.status} />{live && <Countdown until={offer.expires_at} />}</div>
      </div>
      <div className="text-xs text-[color:var(--caelum-text-muted)] mt-1">
        <span className="font-mono">{offer.offer_code}</span> · {offer.distance_km} km · ETA {formatEta(offer.eta_minutes, offer.eta_source)} · cover after {offer.post_transfer_cover_days} days
      </div>
      {offer.proposed_unit_codes?.length > 0 && (
        <div className="text-xs font-mono text-[color:var(--caelum-text-muted)] mt-1">Units: {offer.proposed_unit_codes.join(', ')}</div>
      )}
      {offer.status === 'held' && <div className="text-xs text-[color:var(--caelum-text-muted)] mt-1">Held {formatDateTime(offer.held_at)} · extensions used {offer.hold_extensions}/1</div>}
      {offer.decline_reason && <div className="text-xs text-[color:var(--caelum-text-muted)] mt-1">Declined: {offer.decline_reason}{offer.decline_note ? ` — ${offer.decline_note}` : ''}</div>}
      {display.warnings.length > 0 && (
        <div
          role="status"
          data-testid="offer-warnings"
          className="mt-2 flex items-start gap-2 rounded-xl border border-[color:var(--caelum-amber-text)]/40 bg-bg-inset px-3 py-2 text-xs text-[color:var(--caelum-amber-text)]"
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <ul className="list-disc pl-4 space-y-0.5">
            {display.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
          </ul>
        </div>
      )}
      <ErrorBanner error={error} />
      {incoming && live && !declining && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="ghost" busy={busy} onClick={hold} disabled={offer.status === 'held' && offer.hold_extensions >= 1}>
            {offer.status === 'held' ? 'Extend hold' : 'Hold'}
          </Button>
          <Button variant="success" busy={busy} onClick={accept}>Accept</Button>
          <Button variant="danger" busy={busy} onClick={() => setDeclining(true)}>Decline</Button>
        </div>
      )}
      {declining && (
        <div className="flex flex-wrap items-end gap-2 mt-3">
          <div><label className="label" htmlFor={`dr-${offer.id}`}>Reason</label>
            <select id={`dr-${offer.id}`} className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {DECLINE_REASONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select></div>
          <div className="flex-1 min-w-[8rem]"><label className="label" htmlFor={`dn-${offer.id}`}>Note</label>
            <input id={`dn-${offer.id}`} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <Button variant="danger" busy={busy} onClick={decline}>Confirm decline</Button>
          <Button variant="ghost" onClick={() => setDeclining(false)}>Back</Button>
        </div>
      )}
    </div>
  );
}
