import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { clearRedirect, getLastUser, saveRedirect } from '../lib/session';
import { Loading } from './ui';

/**
 * Signed-in only. `publicHome` is shown instead of the /login redirect when a signed-out visitor
 * opens "/" exactly (the public landing page); signed-in users still get the dashboard there.
 */
export default function ProtectedRoute({ children, publicHome = null }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking session…" />;
  if (!session) {
    if (publicHome && location.pathname === '/') return publicHome;
    saveRedirect(getLastUser(), location.pathname);
    return <Navigate to="/login" replace />;
  }
  clearRedirect();
  return children;
}
