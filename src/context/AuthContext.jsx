import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { meApi } from '../api/me';

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
      const s = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!active) return;
      setSession(s);
      await loadMe(s);
      if (active) setLoading(false);
    }
    init();
    const sub = supabase?.auth.onAuthStateChange((_event, s) => {
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

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setMe(null);
  }, []);

  const value = useMemo(() => ({
    session, me, loading, error, signIn, signOut,
    configured: isSupabaseConfigured,
    facility: me?.facility || null,
    facilityId: me?.facility_id || null,
    isFacility: me?.role === 'facility',
    reload: () => loadMe(session),
  }), [session, me, loading, error, signIn, signOut, loadMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
