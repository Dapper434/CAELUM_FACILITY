import React from 'react';

/** Visible label for a substitute unit, e.g. "Substitute: O- for A+". */
export default function SubstitutePill({ donorType, requestedType }) {
  if (!donorType || !requestedType) return null;
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border-warm bg-bg-inset px-2 py-0.5 text-xs font-semibold text-[color:var(--caelum-amber-text)]">
      Substitute: {donorType} for {requestedType}
    </span>
  );
}
