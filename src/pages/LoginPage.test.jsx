import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const auth = vi.hoisted(() => ({ resetPasswordForEmail: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth } }));
const authState = vi.hoisted(() => ({ session: null, signIn: null, configured: true }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));
import LoginPage, { RESET_SENT } from './LoginPage';
import { Route, Routes } from 'react-router';
import { saveRedirect } from '../lib/session';

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

describe('after sign-in', () => {
  const routes = (entry) => render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Home</p>} />
        <Route path="/requests/:id" element={<p>Request page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  beforeEach(() => { sessionStorage.clear(); authState.session = null; });

  it("goes home, not to another user's saved deep link", async () => {
    saveRedirect('recipient', '/requests/r1');
    authState.signIn = vi.fn(async () => ({ id: 'donor' }));
    routes({ pathname: '/login', state: { from: '/requests/r1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'donor@x.ke' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Sign in'));
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it('returns the same user to their saved deep link', async () => {
    saveRedirect('donor', '/requests/r9');
    authState.signIn = vi.fn(async () => ({ id: 'donor' }));
    routes('/login');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'donor@x.ke' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByText('Sign in'));
    expect(await screen.findByText('Request page')).toBeInTheDocument();
  });

  it('an existing session for a different user lands on home', () => {
    saveRedirect('recipient', '/requests/r1');
    authState.session = { user: { id: 'donor' } };
    routes('/login');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

describe('sign-in password field', () => {
  it('has a show/hide toggle', () => {
    authState.session = null;
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});

describe('sign-in landmarks', () => {

  it('has one h1 and wraps the screen in a main landmark', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CAELUM Facility');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('main').querySelector('main')).toBeNull();
  });
});

describe('sign-in brand panel (?facility=<MFL code>)', () => {
  const at = (search) => render(<MemoryRouter initialEntries={[`/login${search}`]}><LoginPage /></MemoryRouter>);
  const panel = () => screen.getByTestId('brand-panel');

  it('shows the neutral CAELUM panel with no code or an unknown one', () => {
    for (const search of ['', '?facility=99999']) {
      const { unmount } = at(search);
      expect(panel().querySelector('img')).toBeNull();
      expect(panel().querySelector('.auth-neutral')).not.toBeNull();
      expect(screen.queryByText(/^For /)).toBeNull();
      unmount();
    }
  });

  it('shows the official logo and the duotone banner for a hospital that has both', () => {
    at('?facility=90001');
    const imgs = [...panel().querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(imgs.some((s) => /logos\/knh/.test(s))).toBe(true);
    expect(panel().querySelector('img.auth-duotone')).not.toBeNull();
    expect(screen.getByText('Kenyatta National Hospital', { selector: 'form span' })).toBeInTheDocument();
  });

  it('uses an initials badge, never the county emblem, for an emblem-only hospital, with the neutral panel behind it', () => {
    at('?facility=90003');
    expect(panel()).toHaveTextContent('TL5');
    expect(panel()).toHaveTextContent('Thika Level 5 Hospital');
    expect(panel().querySelector('img')).toBeNull();
    expect(panel().querySelector('.auth-neutral')).not.toBeNull();
  });

  it('keeps sign-in working the same with a facility code', () => {
    at('?facility=90007');
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
