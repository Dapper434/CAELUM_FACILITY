import React, { useEffect, useState } from 'react';
import { Button, ErrorBanner, Loading } from './ui';

const MAX_REASON = 500;

/**
 * Manual override hospital picker for recipient officers when automated
 * matching finds no donors. Calls `onSubmit({ donorFacilityId, reason })`.
 */
export default function ManualRequestPicker({
  facilities,
  loading = false,
  error = null,
  excludeFacilityId,
  busy = false,
  onSubmit,
  onCancel,
}) {
  const [donorFacilityId, setDonorFacilityId] = useState('');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState(null);

  const options = (facilities || []).filter((f) => String(f.id) !== String(excludeFacilityId || ''));

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      const tag = event.target?.tagName;
      if (event.target?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      onCancel?.();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!donorFacilityId) {
      setValidationError('Pick a hospital to request from.');
      return;
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError('Enter a reason for this manual request.');
      return;
    }
    if (trimmed.length > MAX_REASON) {
      setValidationError(`Reason must be at most ${MAX_REASON} characters.`);
      return;
    }
    setValidationError(null);
    onSubmit?.({ donorFacilityId, reason: trimmed });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-picker-title"
      className="mt-3 rounded-xl border border-border-warm bg-bg-surface p-3 space-y-3"
    >
      <div>
        <h3 id="manual-picker-title" className="text-sm font-bold text-[color:var(--caelum-text-heading)]">
          Request from a hospital manually
        </h3>
        <p className="text-xs text-[color:var(--caelum-text-muted)] mt-0.5">
          Choose a hospital and explain why an override is needed. This is logged to the audit trail.
        </p>
      </div>

      <ErrorBanner error={error} />
      {loading ? <Loading label="Loading hospitals…" /> : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label text-[color:var(--caelum-text-muted)]" htmlFor="manual-hospital">Hospital</label>
            <select
              id="manual-hospital"
              className="input text-[color:var(--caelum-text)]"
              value={donorFacilityId}
              onChange={(e) => { setDonorFacilityId(e.target.value); setValidationError(null); }}
              disabled={busy}
            >
              <option value="">Select a hospital…</option>
              {options.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}{f.county ? ` (${f.county})` : ''}{f.level_label ? ` · ${f.level_label}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="label mb-0 text-[color:var(--caelum-text-muted)]" htmlFor="manual-reason">Reason</label>
              <span className="text-xs text-[color:var(--caelum-text-muted)] tabular-nums" data-testid="reason-counter">
                {reason.length}/{MAX_REASON}
              </span>
            </div>
            <textarea
              id="manual-reason"
              rows={3}
              maxLength={MAX_REASON}
              className="input text-[color:var(--caelum-text)]"
              placeholder="e.g. Urgent theatre case, nearest regional bank is out of stock"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setValidationError(null); }}
              disabled={busy}
            />
          </div>

          {validationError && <p role="alert" className="text-xs text-crimson-text">{validationError}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" busy={busy}>Send manual request</Button>
            <Button type="button" variant="ghost" className="text-[color:var(--caelum-text)]" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
