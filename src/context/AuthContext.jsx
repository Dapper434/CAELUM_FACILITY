import React, { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { meApi } from '../api/me';
import { clearUserData, getLastUser, setLastUser } from '../lib/session';
import { trackSlow } from '../lib/slow';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRef = useRef(getLastUser());

  /** Drops per-user data when the signed-in user goes away or changes (this tab or another). */
  const trackUser = useCallback((s, event) => {
    const uid = s?.user?.id || null;
    const prev = userRef.current;
    if (event === 'SIGNED_OUT' || !uid) {
      if (prev) clearUserData({ keepRedirect: true });
      userRef.current = null;
      return;
    }
    if (uid !== prev) {
      clearUserData({ keepRedirect: true });
      setLastUser(uid);
      userRef.current = uid;
      if (prev) navigate('/', { replace: true });
    }
  }, [navigate]);

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
      trackUser(s, 'INITIAL');
      setSession(s);
      await loadMe(s);
      if (active) setLoading(false);
    }
    init();
    const sub = supabase?.auth.onAuthStateChange((event, s) => {
      trackUser(s, event);
      setSession(s);
      loadMe(s);
    });
    return () => { active = false; sub?.data?.subscription?.unsubscribe(); };
  }, [loadMe, trackUser]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase sign-in is not configured.');
    const { data, error: err } = await trackSlow(supabase.auth.signInWithPassword({ email, password }));
    if (err) throw err;
    return data?.user || null;
  }, []);

  const signOut = useCallback(async () => {
    clearUserData();
    userRef.current = null;
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

  // Keyed by user: a different user remounts every page, dropping cached data and polling.
  return <AuthContext.Provider value={value}><Fragment key={session?.user?.id || 'signed-out'}>{children}</Fragment></AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
