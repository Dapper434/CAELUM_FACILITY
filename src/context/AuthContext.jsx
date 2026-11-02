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
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadMe(data.session);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadMe(s);
    });
    return () => { active = false; sub?.subscription?.unsubscribe(); };
  }, [loadMe]);

  const signIn = useCallback(async (email, password) => {
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw err;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
