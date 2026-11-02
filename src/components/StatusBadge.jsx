import React from 'react';
import { humanize } from '../utils/format';

const TONES = {
  red: 'bg-status-crimson text-white',
  amber: 'bg-accent-yellow text-slate-900',
  green: 'bg-status-emerald text-white',
  blue: 'bg-brand-cobalt text-white',
  grey: 'bg-slate-200 text-slate-700',
  burgundy: 'bg-brand-burgundy text-white',
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
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${TONES[toneFor(value)]}`}>
      {humanize(value)}
    </span>
  );
}
