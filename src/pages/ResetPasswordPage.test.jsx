import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), updateUser: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth } }));
import ResetPasswordPage, { LINK_WAIT_MS, linkError } from './ResetPasswordPage';
import { validatePassword } from '../components/PasswordForm';

let listener;
const show = () => render(
  <MemoryRouter initialEntries={['/reset-password']}>
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<p>Dashboard</p>} />
    </Routes>
  </MemoryRouter>,
);
const fill = (a, b) => {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: a } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: b } });
  fireEvent.click(screen.getByText('Save and continue'));
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/reset-password');
    auth.getSession.mockReset().mockResolvedValue({ data: { session: null } });
    auth.updateUser.mockReset().mockResolvedValue({ data: {}, error: null });
    auth.onAuthStateChange.mockReset().mockImplementation((cb) => { listener = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  });
  afterEach(() => vi.useRealTimers());

  it('validates length and match', () => {
    expect(validatePassword('short', 'short')).toMatch(/8/);
    expect(validatePassword('longenough', 'different1')).toMatch(/match/);
    expect(validatePassword('longenough', 'longenough')).toBeNull();
  });

  it('opens the form on PASSWORD_RECOVERY, blocks bad input, saves and goes to the dashboard', async () => {
    show();
    await act(async () => listener('PASSWORD_RECOVERY', { access_token: 'x' }));
    fill('short', 'short');
    expect(screen.getByText(/at least 8/)).toBeInTheDocument();
    fill('newpassword1', 'newpassword2');
    expect(screen.getByText(/do not match/)).toBeInTheDocument();
    expect(auth.updateUser).not.toHaveBeenCalled();
    fill('newpassword1', 'newpassword1');
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword1' });
  });

  it('uses a session that already exists on load (invite link processed early)', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'x' } } });
    show();
    expect(await screen.findByLabelText('New password')).toBeInTheDocument();
  });

  it('shows the expired state for error_code=otp_expired in the hash', () => {
    window.history.replaceState(null, '', '/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
    expect(linkError()).toEqual({ code: 'otp_expired', description: 'Email link is invalid' });
    show();
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid or has expired/);
    expect(screen.getByText('Request a new link')).toHaveAttribute('href', '/login?forgot=1');
  });

  it('shows the expired state when no session arrives', async () => {
    vi.useFakeTimers();
    show();
    await act(async () => { vi.advanceTimersByTime(LINK_WAIT_MS + 10); });
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid or has expired/);
  });
});
