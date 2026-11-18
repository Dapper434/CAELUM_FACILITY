import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import PasswordForm from '../components/PasswordForm';
import { Loading } from '../components/ui';
import BrandMark from '../components/BrandMark';
import SignInBrandPanel from '../components/SignInBrandPanel';

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

  // Same split layout as sign-in. Invite and recovery links carry no hospital code, so the panel is neutral.
  return (
    <main className="min-h-screen bg-bg-surface md:grid md:grid-cols-2">
      <SignInBrandPanel brand={null} />
      <SignInBrandPanel brand={null} strip />
      <div className="flex items-start md:items-center justify-center px-5 pt-6 pb-10 md:p-10 md:bg-bg-canvas">
        <div className="w-full max-w-sm space-y-4 md:card md:p-8">
          <div className="flex items-center gap-3">
            <BrandMark className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Set your password</h1>
              <p className="text-xs text-slate-600">CAELUM Facility</p>
            </div>
          </div>
          {state === 'waiting' && <Loading label="Checking your link…" />}
          {state === 'ready' && <PasswordForm onSubmit={save} submitLabel="Save and continue" />}
          {state === 'invalid' && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-brand-burgundy">This link is invalid or has expired. Request a new one to set your password.</p>
              <Link to="/login?forgot=1" className="inline-flex items-center min-h-11 text-sm font-semibold text-brand-cobalt hover:underline underline-offset-2">Request a new link</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
