import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import PasswordForm from '../components/PasswordForm';
import { Loading } from '../components/ui';

export const LINK_WAIT_MS = 4000;

/** Error carried in an invite/recovery link (hash or query), e.g. error_code=otp_expired. */
export function linkError(loc = window.location) {
  const params = new URLSearchParams(loc.search);
  new URLSearchParams(String(loc.hash || '').replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  const code = params.get('error_code') || params.get('error');
  if (!code) return null;
  return { code, description: params.get('error_description') || '' };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => (linkError() || !supabase ? 'invalid' : 'waiting'));

  useEffect(() => {
    if (state !== 'waiting') return undefined;
    let done = false;
    const ready = () => { if (!done) { done = true; setState('ready'); } };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) ready();
    });
    supabase.auth.getSession().then(({ data: d }) => { if (d?.session) ready(); });
    const timer = setTimeout(() => { if (!done) { done = true; setState('invalid'); } }, LINK_WAIT_MS);
    return () => { clearTimeout(timer); data?.subscription?.unsubscribe(); };
  }, [state]);

  async function save(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-lg font-extrabold text-slate-900">Set your password</h1>
        {state === 'waiting' && <Loading label="Checking your link…" />}
        {state === 'ready' && <PasswordForm onSubmit={save} submitLabel="Save and continue" />}
        {state === 'invalid' && (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-brand-burgundy">This link is invalid or has expired. Request a new one to set your password.</p>
            <Link to="/login?forgot=1" className="inline-block text-sm font-semibold text-brand-cobalt">Request a new link</Link>
          </div>
        )}
      </div>
    </div>
  );
}
