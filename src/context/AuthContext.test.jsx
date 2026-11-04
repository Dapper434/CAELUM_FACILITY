import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

const h = vi.hoisted(() => ({ listener: null, session: null }));
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: {
    getSession: async () => ({ data: { session: h.session } }),
    onAuthStateChange: (cb) => { h.listener = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    signOut: vi.fn(async () => {}),
  } },
}));
vi.mock('../api/me', () => ({ meApi: { get: vi.fn(async () => ({ role: 'facility', facility_id: 'f' })) } }));
import { AuthProvider, useAuth } from './AuthContext';

function Where() {
  const { signOut } = useAuth();
  return <><p data-testid="path">{useLocation().pathname}</p><button type="button" onClick={signOut}>out</button></>;
}
const show = (path) => render(
  <MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="*" element={<Where />} /></Routes></AuthProvider></MemoryRouter>,
);

describe('AuthProvider user changes', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); h.session = { user: { id: 'recipient' } }; });

  it('goes home and clears app data when another user signs in (e.g. from another tab)', async () => {
    show('/requests/r-recipient');
    await act(async () => {});
    localStorage.setItem('caelum.cache', 'recipient data');
    h.session = { user: { id: 'donor' } };
    await act(async () => h.listener('SIGNED_IN', { user: { id: 'donor' } }));
    expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem('caelum.cache')).toBeNull();
    expect(sessionStorage.getItem('caelum.lastUser')).toBe('donor');
  });

  it('does not re-run session setup on navigation', async () => {
    const { meApi } = await import('../api/me');
    meApi.get.mockClear();
    show('/');
    await act(async () => {});
    expect(meApi.get).toHaveBeenCalledTimes(1);
    await act(async () => h.listener('SIGNED_IN', { user: { id: 'other' } }));
    expect(meApi.get).toHaveBeenCalledTimes(2);
  });

  it('clears app data on a SIGNED_OUT event but keeps Supabase keys', async () => {
    show('/');
    await act(async () => {});
    localStorage.setItem('caelum.cache', 'x');
    localStorage.setItem('sb-qvq-auth-token', 'kept');
    await act(async () => h.listener('SIGNED_OUT', null));
    expect(localStorage.getItem('caelum.cache')).toBeNull();
    expect(localStorage.getItem('sb-qvq-auth-token')).toBe('kept');
  });

  it('explicit sign-out clears the saved redirect too', async () => {
    show('/');
    await act(async () => {});
    sessionStorage.setItem('caelum.redirect', JSON.stringify({ userId: 'recipient', path: '/requests/r1' }));
    await act(async () => fireEvent.click(screen.getByText('out')));
    expect(sessionStorage.getItem('caelum.redirect')).toBeNull();
    expect(sessionStorage.getItem('caelum.lastUser')).toBeNull();
  });
});
