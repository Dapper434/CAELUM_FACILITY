import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorBanner } from '../components/ui';
import DemoLogin from '../components/DemoLogin';

export default function LoginPage() {
  const { session, signIn, configured, demoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (session) return <Navigate to={location.state?.from || '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold">C</span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">CAELUM Facility</h1>
            <p className="text-xs text-slate-500">Sign in with your hospital account</p>
          </div>
        </div>
        
        <ErrorBanner error={error} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {configured && <Button type="submit" busy={busy} className="w-full">Sign in</Button>}
        {demoMode && <DemoLogin onDone={() => navigate(location.state?.from || '/', { replace: true })} />}
      </form>
    </div>
  );
}
