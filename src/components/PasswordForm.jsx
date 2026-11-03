import React, { useState } from 'react';
import { Button, ErrorBanner } from './ui';

export const MIN_PASSWORD = 8;

/** Returns an error message, or null when the pair is acceptable. */
export function validatePassword(password, confirm) {
  if (!password || password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

/** New password + confirm. `onSubmit(password)` may throw; its message is shown. */
export default function PasswordForm({ onSubmit, submitLabel = 'Save password' }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [invalid, setInvalid] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const v = validatePassword(password, confirm);
    setInvalid(v);
    if (v) return;
    setBusy(true);
    try {
      await onSubmit(password);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <ErrorBanner error={error} />
      <div>
        <label className="label" htmlFor="new-password">New password</label>
        <input id="new-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      {invalid && <p className="text-xs text-status-crimson" role="status">{invalid}</p>}
      <Button type="submit" busy={busy}>{submitLabel}</Button>
    </form>
  );
}
