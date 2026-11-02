/** Parse "caelum:v1:<transfer_id>:<seal>:<exp_unix>:<sig>". */
export function parseQrPayload(payload) {
  const parts = String(payload || '').split(':');
  if (parts.length !== 6 || parts[0] !== 'caelum' || parts[1] !== 'v1') return null;
  return { transferId: parts[2], seal: parts[3], expiresAt: new Date(Number(parts[4]) * 1000), sig: parts[5] };
}
