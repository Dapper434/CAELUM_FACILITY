const TZ = 'Africa/Nairobi';

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d) + ' EAT';
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d);
}

/** Milliseconds left until `iso` (never negative). */
export function msUntil(iso, now = Date.now()) {
  if (!iso) return 0;
  return Math.max(0, new Date(iso).getTime() - now);
}

/** "mm:ss" or "h:mm:ss" countdown string. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatEta(minutes, source) {
  if (minutes === null || minutes === undefined) return '—';
  const label = `${Math.round(minutes)} min`;
  return source === 'estimate' ? `${label} (estimate)` : label;
}

export function formatTemp(c) {
  if (c === null || c === undefined) return '—';
  return `${Number(c).toFixed(1)} °C`;
}

export function humanize(value) {
  if (!value) return '';
  return String(value).replace(/_/g, ' ').replace(/^./, (ch) => ch.toUpperCase());
}
