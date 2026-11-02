import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorBanner } from './ui';

export default function DemoLogin({ onDone }) {
  const { signInDemo } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  async function go(login) {
    setBusy(login); setError(null);
    try { await signInDemo(login); onDone?.(); } catch (err) { setError(err); } finally { setBusy(null); }
  }
  return (
    <div className="space-y-2 border-t border-border-warm pt-4">
      <div className="label">Demo mode (memory-store API)</div>
      <ErrorBanner error={error} />
      <div className="flex gap-2">
        <Button variant="ghost" busy={busy === 'recipient'} onClick={() => go('recipient')}>Recipient · Mama Lucy</Button>
        <Button variant="ghost" busy={busy === 'donor'} onClick={() => go('donor')}>Donor · Nairobi Hub</Button>
      </div>
    </div>
  );
}
