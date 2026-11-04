import { formatTime } from './format';

const hhmm = (iso) => formatTime(iso).slice(0, 5);

// Contract §3.3: a transfer ends at delivered or cancelled.
export const TERMINAL_STAGES = ['delivered', 'cancelled'];
export const TRANSFER_POLL_MS = 12000;

export const isActiveTransfer = (t) => Boolean(t?.stage) && !TERMINAL_STAGES.includes(t.stage);

/** Poll interval for a set of shown transfers: only while at least one is still active. */
export function transferPollInterval(transfers) {
  const list = Array.isArray(transfers) ? transfers : [transfers];
  return list.some(isActiveTransfer) ? TRANSFER_POLL_MS : 0;
}

/** courier_accepted_at is top-level on Transfer; also tolerate a nested job/courier object. */
export function courierAcceptedAt(t) {
  return t?.courier_accepted_at || t?.job?.courier_accepted_at || t?.courier?.courier_accepted_at || t?.courier?.accepted_at || null;
}

/** Extra status text for courier_assigned (the API keeps that stage after the courier accepts). */
export function courierStatusLabel(t) {
  if (t?.stage !== 'courier_assigned') return null;
  const at = courierAcceptedAt(t);
  return at ? `Courier accepted at ${hhmm(at)} – awaiting pickup` : 'Courier assigned – waiting for courier to accept';
}
