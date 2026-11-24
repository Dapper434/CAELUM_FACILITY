import React from 'react';
import { humanize } from '../utils/format';

const TONES = {
  red: 'border-red-200/80 bg-red-50 text-red-700',
  amber: 'border-amber-200/80 bg-amber-50 text-amber-800',
  green: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  blue: 'border-sky-200/80 bg-sky-50 text-sky-800',
  grey: 'border-slate-200 bg-slate-50 text-slate-600',
  burgundy: 'border-rose-200/80 bg-rose-50 text-rose-700',
};

const DOTS = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  grey: 'bg-slate-400',
  burgundy: 'bg-rose-500',
};

const MAP = {
  emergency: 'red', critical: 'red', expired: 'grey', declined: 'grey', cancelled: 'grey', dismissed: 'grey',
  lapsed: 'grey', withdrawn: 'grey', discarded: 'grey',
  urgent: 'amber', pending: 'amber', suggested: 'amber', held: 'amber', reserved: 'amber', moderate: 'amber',
  routine: 'blue', open: 'blue', offered: 'blue', packed: 'blue', courier_assigned: 'blue', in_transit: 'burgundy', arrived: 'burgundy',
  accepted: 'green', matched: 'green', fulfilled: 'green', delivered: 'green', available: 'green', resolving: 'green',
};

export function toneFor(value) {
  return MAP[value] || 'grey';
}

export default function StatusBadge({ value }) {
  if (!value) return null;
  const tone = toneFor(value);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] ${TONES[tone]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} aria-hidden />
      {humanize(value)}
    </span>
  );
}
