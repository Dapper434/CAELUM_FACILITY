import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { clearRedirect, getLastUser, saveRedirect } from '../lib/session';
import { Loading } from './ui';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking session…" />;
  if (!session) {
    saveRedirect(getLastUser(), location.pathname);
    return <Navigate to="/login" replace />;
  }
  clearRedirect();
  return children;
}
