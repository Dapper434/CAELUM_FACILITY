import React from 'react';
import { Timer } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import { formatCountdown } from '../utils/format';

export default function Countdown({ until, label = 'Expires in' }) {
  const ms = useCountdown(until);
  if (!until) return null;
  const urgent = ms < 60_000;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${urgent ? 'text-status-crimson' : 'text-slate-700'}`}>
      <Timer className="w-3.5 h-3.5" />
      {ms === 0 ? 'Timed out' : `${label} ${formatCountdown(ms)}`}
    </span>
  );
}
