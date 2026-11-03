import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const auth = vi.hoisted(() => ({ resetPasswordForEmail: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: null, signIn: vi.fn(), configured: true }) }));
import LoginPage, { RESET_SENT } from './LoginPage';

function openForgot() {
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  fireEvent.click(screen.getByText('Forgot password?'));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' nurse@hospital.ke ' } });
  fireEvent.click(screen.getByText('Send reset link'));
}

describe('forgot password', () => {
  beforeEach(() => auth.resetPasswordForEmail.mockReset());

  it('sends the link with the reset-password redirect and a neutral message', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    openForgot();
    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('nurse@hospital.ke', { redirectTo: `${window.location.origin}/reset-password` });
  });

  it('shows the same message when Supabase returns an error', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: { status: 400, message: 'User not found' } });
    openForgot();
    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
    expect(screen.queryByText(/not found/i)).toBeNull();
  });

  it('reports network failures without the neutral message', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' } });
    openForgot();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach/);
    expect(screen.queryByText(RESET_SENT)).toBeNull();
  });
});
