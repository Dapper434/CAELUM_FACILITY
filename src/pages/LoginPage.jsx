import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { redirectFor } from '../lib/session';
import { Button, ErrorBanner } from '../components/ui';
import PasswordInput from '../components/PasswordInput';
import BrandMark from '../components/BrandMark';
import SignInBrandPanel from '../components/SignInBrandPanel';
import { brandFor } from '../theme/facilityBrand';

export const RESET_SENT = 'If that email exists, we sent a link to reset the password.';

/** Sends the reset link. Resolves to a neutral message; throws only when the server can't be reached. */
export async function requestPasswordReset(email) {
  if (!supabase) throw new Error('Supabase sign-in is not configured.');
  let res;
  try {
    res = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
  } catch {
    throw new Error('Could not reach the sign-in service. Check your connection and try again.');
  }
  const err = res?.error;
  if (err && (err.name === 'AuthRetryableFetchError' || err.status === 0)) {
    throw new Error('Could not reach the sign-in service. Check your connection and try again.');
  }
  return RESET_SENT;
}

export default function LoginPage() {
  const { session, signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [forgot, setForgot] = useState(() => new URLSearchParams(location.search).get('forgot') === '1');
  const [resetMsg, setResetMsg] = useState(null);
  const [params] = useSearchParams();
  const brand = brandFor(params.get('facility'));

  // Home by default; a saved deep link only for the same user who left it.
  if (session) return <Navigate to={redirectFor(session.user?.id) || '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (forgot) {
        setResetMsg(await requestPasswordReset(email));
        return;
      }
      const user = await signIn(email, password);
      navigate(redirectFor(user?.id) || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-surface md:grid md:grid-cols-2">
      <SignInBrandPanel brand={brand} />
      <SignInBrandPanel brand={brand} strip />
      <div className="flex items-start md:items-center justify-center px-5 pt-6 pb-10 md:p-10 md:bg-bg-canvas">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 md:card md:p-8">
          <div className="flex items-center gap-3">
            <BrandMark className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">CAELUM Facility</h1>
              <p className="text-xs text-slate-600">Sign in with your hospital account</p>
            </div>
          </div>
          {brand && <p className="text-sm text-slate-700">For <span className="font-semibold text-slate-900">{brand.name}</span></p>}

          <ErrorBanner error={error} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          {!forgot && (
            <div>
              <label className="label" htmlFor="password">Password</label>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          )}
          {resetMsg && <p role="status" className="text-sm text-slate-600">{resetMsg}</p>}
          {configured && <Button type="submit" busy={busy} className="w-full min-h-11 text-sm">{forgot ? 'Send reset link' : 'Sign in'}</Button>}
          {configured && (
            <button type="button" className="inline-flex items-center min-h-11 text-xs font-semibold text-brand-cobalt hover:underline underline-offset-2" onClick={() => { setForgot(!forgot); setResetMsg(null); setError(null); }}>
              {forgot ? 'Back to sign in' : 'Forgot password?'}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
