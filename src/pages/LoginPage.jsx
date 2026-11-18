import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { redirectFor } from '../lib/session';
import { Button, ErrorBanner } from '../components/ui';
import PasswordInput from '../components/PasswordInput';
import BrandMark from '../components/BrandMark';
import SignInBrandPanel from '../components/SignInBrandPanel';
import FacilityBadge from '../components/FacilityBadge';
import { brandFor, classifyEmail } from '../theme/facilityBrand';

export const RESET_SENT = 'If that email exists, we sent a link to reset the password.';
export const ADMIN_CONSOLE_URL = 'https://caelum-console.vercel.app';
export const COURIER_APP_URL = 'https://caelum-courier.vercel.app';

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

/**
 * Email-first sign-in (Round 2 Task 2). Step 1 asks for the email only; step 2 asks for the password on a panel
 * branded for the hospital the app recognises from that email (no server lookup, see classifyEmail). Supabase still
 * checks email and password together at step 2. ?facility=<MFL> links brand the panel from the start, and
 * ?forgot=1 opens the reset form directly.
 */
export default function LoginPage() {
  const { session, signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'password'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [forgot, setForgot] = useState(() => new URLSearchParams(location.search).get('forgot') === '1');
  const [resetMsg, setResetMsg] = useState(null);
  const [params] = useSearchParams();
  const moved = useRef(false);

  const onPasswordStep = step === 'password' && !forgot;
  const match = onPasswordStep ? classifyEmail(email) : null;
  const emailBrand = match?.kind === 'facility' ? brandFor(match.mfl) : null;
  const brand = emailBrand || brandFor(params.get('facility'));
  // The form header turns into the hospital's only when the typed email matched a hospital.
  const headerBrand = onPasswordStep ? emailBrand : null;

  // Move focus with the step (not on first load), so keyboard and screen-reader users land on the next field.
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    document.getElementById(onPasswordStep ? 'password' : 'email')?.focus();
  }, [onPasswordStep]);

  // Home by default; a saved deep link only for the same user who left it.
  if (session) return <Navigate to={redirectFor(session.user?.id) || '/'} replace />;

  const changeEmail = () => { setStep('email'); setPassword(''); setError(null); };
  const toggleForgot = () => { setForgot(!forgot); setResetMsg(null); setError(null); };

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (forgot) {
      setBusy(true);
      try { setResetMsg(await requestPasswordReset(email)); } catch (err) { setError(err); } finally { setBusy(false); }
      return;
    }
    if (step === 'email') {
      if (!email.trim()) { setError(new Error('Enter your email to continue.')); return; }
      setEmail(email.trim());
      setStep('password');
      return;
    }
    setBusy(true);
    try {
      const user = await signIn(email, password);
      navigate(redirectFor(user?.id) || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const otherApp = match?.kind === 'admin'
    ? { who: 'a CAELUM admin account', name: 'Admin console', url: ADMIN_CONSOLE_URL }
    : match?.kind === 'courier' ? { who: 'a courier account', name: 'Courier app', url: COURIER_APP_URL } : null;

  return (
    <main className="min-h-screen bg-bg-surface md:grid md:grid-cols-2">
      <SignInBrandPanel key={`p-${brand?.mfl || 'neutral'}`} brand={brand} />
      <SignInBrandPanel key={`s-${brand?.mfl || 'neutral'}`} brand={brand} strip />
      <div className="flex items-start md:items-center justify-center px-5 pt-6 pb-10 md:p-10 md:bg-bg-canvas">
        <form onSubmit={onSubmit}
          className="relative w-full max-w-sm space-y-4 md:card md:p-8 md:overflow-hidden">
          {brand && <span className="absolute top-0 inset-x-0 h-1 hidden md:block" style={{ backgroundColor: brand.accent }} aria-hidden="true" />}
          {headerBrand ? (
            <div className="flex items-center gap-3 min-w-0">
              <FacilityBadge size="sm" tone="accent" name={headerBrand.name} code={headerBrand.code} logo={headerBrand.logo}
                accent={headerBrand.accent} showName={false} logoAlt={`${headerBrand.name} logo`} logoLoading="eager" />
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-slate-900 leading-snug break-words">{headerBrand.name}</h1>
                <p className="text-xs text-slate-600">Sign in to CAELUM Facility</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <BrandMark className="w-9 h-9" />
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">CAELUM Facility</h1>
                <p className="text-xs text-slate-600">Sign in with your hospital account</p>
              </div>
            </div>
          )}
          <p role="status" className="sr-only">{onPasswordStep ? (brand ? `Signing in to ${brand.name}.` : 'Enter your password.') : ''}</p>

          <ErrorBanner error={error} />
          {onPasswordStep ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border-warm bg-bg-inset px-3 py-1">
                <span className="min-w-0 text-sm">
                  <span className="block text-xs text-slate-600">Signing in as</span>
                  <span className="block truncate font-semibold text-slate-900">{email}</span>
                </span>
                <button type="button" onClick={changeEmail}
                  className="shrink-0 inline-flex items-center min-h-11 px-2 rounded-lg text-xs font-semibold text-brand-cobalt hover:underline underline-offset-2 transition-colors duration-150">
                  Change<span className="sr-only"> email</span>
                </button>
              </div>
              {/* Lets password managers pair the saved password with this email. */}
              <input type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
              {otherApp && (
                <p className="text-sm text-slate-700 rounded-xl border border-border-warm bg-bg-inset p-3">
                  This looks like {otherApp.who}. You can sign in at the{' '}
                  <a className="font-semibold text-brand-cobalt underline underline-offset-2" href={otherApp.url}>{otherApp.name}</a>.
                </p>
              )}
              <div>
                <label className="label" htmlFor="password">Password</label>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
            </>
          ) : (
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
            </div>
          )}
          {resetMsg && <p role="status" className="text-sm text-slate-600">{resetMsg}</p>}
          {configured && (
            <Button type="submit" busy={busy} className="w-full min-h-11 text-sm">
              {forgot ? 'Send reset link' : onPasswordStep ? 'Sign in' : 'Continue'}
            </Button>
          )}
          {configured && (
            <button type="button" className="inline-flex items-center min-h-11 text-xs font-semibold text-brand-cobalt hover:underline underline-offset-2" onClick={toggleForgot}>
              {forgot ? 'Back to sign in' : 'Forgot password?'}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
