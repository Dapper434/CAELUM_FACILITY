import React, { useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';
import { Button } from './ui';
import { formatDateTime, formatEta } from '../utils/format';
import { productLabel } from '../utils/constants';
import SubstitutePill from './SubstitutePill';
import CandidatesEmpty from './CandidatesEmpty';

const MAX_REASON = 500;

export default function CandidateList({
  candidates,
  onOffer,
  busy,
  canOffer,
  emptyAction,
  requestedBloodGroup,
  onSearchNational,
  onShowCompatible,
  onManualRequest,
  renderManualPicker,
  onManualToggle,
}) {
  const [confirmRow, setConfirmRow] = useState(null);
  const [substituteReason, setSubstituteReason] = useState('');

  useEffect(() => {
    if (!confirmRow) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setConfirmRow(null);
      setSubstituteReason('');
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [confirmRow]);

  if (!candidates || candidates.length === 0) {
    return (
      <CandidatesEmpty
        onSearchNational={onSearchNational}
        onShowCompatible={onShowCompatible}
        onManualRequest={onManualRequest}
        renderManualPicker={renderManualPicker}
        onManualToggle={onManualToggle}
        busy={busy}
      >
        {emptyAction}
      </CandidatesEmpty>
    );
  }

  return (
    <ol className="space-y-2">
      {candidates.map((c) => {
        const donorType = c.substituteGroup || c.substitute_group || c.blood_group || c.donor_blood_group;
        const reqType = c.requested_blood_group || requestedBloodGroup;
        const product = c.substituteProduct || c.product;
        const note = c.substituteNote || c.note;
        const confirming = confirmRow && String(confirmRow.donor_facility_id) === String(c.donor_facility_id);
        const reasonId = `sub-reason-${c.donor_facility_id}`;

        return (
          <li key={c.donor_facility_id} className="rounded-xl border border-border-warm bg-bg-inset p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-brand-cobalt text-white text-xs font-bold flex items-center justify-center shrink-0">{c.rank}</span>
                <div>
                  <div className="text-sm font-bold text-[color:var(--caelum-text-heading)]">
                    {c.donor_name}{' '}
                    <span className="text-xs font-normal text-[color:var(--caelum-text-muted)]">{c.donor_level_label}</span>
                  </div>
                  <div className="text-xs text-[color:var(--caelum-text-muted)]">
                    ETA <strong data-testid="eta">{formatEta(c.elapsed_minutes, c.eta_source)}</strong>
                    {' '}· {c.distance_km} km · road {c.road_minutes} + handling {c.handling_minutes} min
                  </div>
                  <div className="text-xs text-[color:var(--caelum-text-muted)]">
                    Stock {c.current_stock} → {c.post_transfer_units} · {c.post_transfer_cover_days} days cover after · earliest expiry {formatDateTime(c.earliest_expiry)}
                  </div>
                  {c.cold_chain_viable && (
                    <div className="text-xs text-emerald-text flex items-center gap-1 mt-0.5">
                      <Snowflake className="w-3 h-3" /> Cold chain viable
                    </div>
                  )}
                  {c.substitute === true && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SubstitutePill donorType={donorType} requestedType={reqType} />
                        {product && (
                          <span className="text-xs text-[color:var(--caelum-text-muted)]">
                            {productLabel(product)}
                          </span>
                        )}
                      </div>
                      {note && <p className="text-xs text-[color:var(--caelum-text-muted)]">{note}</p>}
                    </div>
                  )}
                </div>
              </div>
              {canOffer && (
                <Button
                  busy={busy}
                  onClick={() => {
                    if (c.substitute === true) {
                      setSubstituteReason('');
                      setConfirmRow(c);
                    } else {
                      onOffer(c);
                    }
                  }}
                >
                  Send offer
                </Button>
              )}
            </div>

            {confirming && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`sub-confirm-${c.donor_facility_id}`}
                className="rounded-xl border border-border-warm bg-bg-surface p-3 space-y-2.5"
              >
                <p id={`sub-confirm-${c.donor_facility_id}`} className="text-sm text-[color:var(--caelum-text)]">
                  Send a compatible substitute offer ({donorType || 'compatible'} for {reqType || 'requested'}) from {c.donor_name}? An officer must confirm compatible substitution.
                </p>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={reasonId} className="label text-[color:var(--caelum-text-muted)]">
                      Reason (optional)
                    </label>
                    <span className="text-xs text-[color:var(--caelum-text-muted)] tabular-nums">
                      {substituteReason.length}/{MAX_REASON}
                    </span>
                  </div>
                  <input
                    id={reasonId}
                    type="text"
                    maxLength={MAX_REASON}
                    className="input bg-bg-inset text-[color:var(--caelum-text)] border-border-warm"
                    placeholder="Optional clinical or officer note for the audit trail"
                    value={substituteReason}
                    onChange={(e) => setSubstituteReason(e.target.value.slice(0, MAX_REASON))}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    busy={busy}
                    onClick={() => {
                      const trimmed = substituteReason.trim();
                      onOffer(c, {
                        confirmSubstitute: true,
                        substituteReason: trimmed || undefined,
                      });
                      setConfirmRow(null);
                      setSubstituteReason('');
                    }}
                  >
                    Confirm substitute offer
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-[color:var(--caelum-text)]"
                    onClick={() => {
                      setConfirmRow(null);
                      setSubstituteReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
