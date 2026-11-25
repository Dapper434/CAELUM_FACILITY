import React, { useEffect, useState } from 'react';
import { Button, Empty } from './ui';

const ACTIONS = [
  {
    key: 'national',
    label: 'Search nationally',
    confirm: 'Search for donors nationally? This looks beyond your usual region.',
  },
  {
    key: 'compatible',
    label: 'Show compatible types',
    confirm: 'Show compatible blood types? Substitute units need an officer to confirm.',
  },
  {
    key: 'manual',
    label: 'Request from a hospital manually',
    confirm: 'Request from a hospital manually? You’ll pick a hospital and give a reason.',
  },
];

/**
 * Empty ranked-candidates panel. Action buttons appear only when their
 * handler prop is passed; each one opens a confirm step before running it.
 */
export default function CandidatesEmpty({
  onSearchNational,
  onShowCompatible,
  onManualRequest,
  children,
}) {
  const handlers = {
    national: onSearchNational,
    compatible: onShowCompatible,
    manual: onManualRequest,
  };
  const available = ACTIONS.filter((action) => typeof handlers[action.key] === 'function');
  const [pendingKey, setPendingKey] = useState(null);
  const pending = available.find((action) => action.key === pendingKey) || null;

  useEffect(() => {
    if (!pending) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setPendingKey(null);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [pending]);

  return (
    <div>
      <Empty>No eligible donors in region</Empty>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {available.map((action) => (
            <Button
              key={action.key}
              variant="ghost"
              onClick={() => setPendingKey(action.key)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fallback-confirm-title"
          className="mt-3 rounded-xl border border-border-warm bg-bg-surface p-3"
        >
          <p id="fallback-confirm-title" className="text-sm text-[color:var(--caelum-text)]">{pending.confirm}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                handlers[pending.key]();
                setPendingKey(null);
              }}
            >
              Confirm
            </Button>
            <Button variant="ghost" onClick={() => setPendingKey(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
