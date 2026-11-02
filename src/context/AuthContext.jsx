import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { config } from '../lib/config';
import { clearDemoSession, getDemoToken, setDemoSession } from '../lib/demoSession';
import { meApi } from '../api/me';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async (s) => {
    if (!s) { setMe(null); return; }
    try {
      setMe(await meApi.get());
      setError(null);
    } catch (err) {
      setMe(null);
      setError(err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      let s = getDemoToken() ? { demo: true } : null;
      if (!s && supabase) s = (await supabase.auth.getSession()).data.session;
      if (!active) return;
      setSession(s);
      await loadMe(s);
      if (active) setLoading(false);
    }
    init();
    const sub = supabase?.auth.onAuthStateChange((_event, s) => {
      if (getDemoToken()) return;
      setSession(s);
      loadMe(s);
    });
    return () => { active = false; sub?.data?.subscription?.unsubscribe(); };
  }, [loadMe]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase sign-in is not configured.');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw err;
  }, []);

  const signInDemo = useCallback(async (login) => {
    const res = await authApi.demoLogin(login);
    setDemoSession(res);
    const s = { demo: true };
    setSession(s);
    await loadMe(s);
  }, [loadMe]);

  const signOut = useCallback(async () => {
    clearDemoSession();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setMe(null);
  }, []);

  const value = useMemo(() => ({
    session, me, loading, error, signIn, signInDemo, signOut,
    configured: isSupabaseConfigured,
    demoMode: config.demoMode,
    facility: me?.facility || null,
    facilityId: me?.facility_id || null,
    isFacility: me?.role === 'facility',
    reload: () => loadMe(session),
  }), [session, me, loading, error, signIn, signInDemo, signOut, loadMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
