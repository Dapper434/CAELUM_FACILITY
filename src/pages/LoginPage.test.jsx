import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

/** Email-first flow: type the email, Continue, then the password. */
function signInWith(email, password) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

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
    signInWith('donor@x.ke', 'pw');
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it('returns the same user to their saved deep link', async () => {
    saveRedirect('donor', '/requests/r9');
    authState.signIn = vi.fn(async () => ({ id: 'donor' }));
    routes('/login');
    signInWith('donor@x.ke', 'pw');
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
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nurse@hospital.ke' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
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
    expect(screen.queryByText(/^For /)).toBeNull(); // no separate "For <hospital>" line any more
  });

  it('uses an initials badge, never the county emblem, for an emblem-only hospital, with the neutral panel behind it', () => {
    at('?facility=90003');
    expect(panel()).toHaveTextContent('TL5');
    expect(panel()).toHaveTextContent('Thika Level 5 Hospital');
    expect(panel().querySelector('img')).toBeNull();
    expect(panel().querySelector('.auth-neutral')).not.toBeNull();
  });

  it('keeps the email-first flow with a facility code', () => {
    at('?facility=90007');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('email-first sign-in personalises step 2', () => {
  beforeEach(() => { authState.session = null; authState.signIn = vi.fn(async () => ({ id: 'u' })); });
  const at = (search = '') => render(<MemoryRouter initialEntries={[`/login${search}`]}><LoginPage /></MemoryRouter>);
  const panel = () => screen.getByTestId('brand-panel');
  const continueWith = (email) => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  };

  it('asks for the email only at step 1, on the neutral panel', () => {
    at();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(panel().querySelector('.auth-neutral')).not.toBeNull();
  });

  it('recognises the hospital from the email and brands the password step', () => {
    at();
    continueWith(' KNH.bloodbank@caelum.demo ');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect([...panel().querySelectorAll('img')].some((i) => /logos\/knh/.test(i.getAttribute('src')))).toBe(true);
    expect(panel()).toHaveTextContent('Welcome back.');
    expect(panel()).toHaveTextContent('Kenyatta National Hospital');
    expect(screen.getByText('Signing in to Kenyatta National Hospital.')).toBeInTheDocument();
    expect(screen.getByText('KNH.bloodbank@caelum.demo')).toBeInTheDocument(); // trimmed, shown as typed
  });

  it.each([
    ['thika.lab@caelum.demo', 'TL5', 'Thika Level 5 Hospital'],
    ['donor@caelum.demo', null, 'Nairobi Hospital Hub'],
    ['recipient@caelum.demo', null, 'Mama Lucy Kibaki Hospital'],
  ])('brands %s', (email, code, name) => {
    at();
    continueWith(email);
    expect(panel()).toHaveTextContent(name);
    if (code) expect(panel()).toHaveTextContent(code);
  });

  it('keeps unknown and look-alike emails neutral', () => {
    at();
    continueWith('knh.bloodbank@gmail.com');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(panel().querySelector('.auth-neutral')).not.toBeNull();
    expect(panel()).not.toHaveTextContent('Kenyatta');
  });

  it.each([
    ['admin2@caelum.demo', 'Admin console', 'https://caelum-console.vercel.app'],
    ['courier7@caelum.demo', 'Courier app', 'https://caelum-courier.vercel.app'],
  ])('points %s to its own app without blocking sign-in', (email, linkName, href) => {
    at();
    continueWith(email);
    expect(screen.getByRole('link', { name: linkName })).toHaveAttribute('href', href);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('goes back to step 1 with Change, keeping the email', () => {
    at();
    continueWith('mtrh.lab@caelum.demo');
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
    expect(screen.getByLabelText('Email')).toHaveValue('mtrh.lab@caelum.demo');
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(panel().querySelector('.auth-neutral')).not.toBeNull();
  });

  it('lets the email win over a ?facility link, and keeps the link brand for unknown emails', () => {
    at('?facility=90007');
    expect(panel()).toHaveTextContent('Moi Teaching and Referral Hospital');
    continueWith('cgtrh.bloodbank@caelum.demo');
    expect(panel()).toHaveTextContent('Coast General Teaching and Referral Hospital');
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
    continueWith('someone@hospital.ke');
    expect(panel()).toHaveTextContent('Moi Teaching and Referral Hospital');
  });

  it('asks for an email before continuing, and signs in with the typed email and password', async () => {
    at();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByLabelText('Password')).toBeNull(); // the required email field stops an empty Continue
    continueWith('kcrh.lab@caelum.demo');
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(authState.signIn).toHaveBeenCalledWith('kcrh.lab@caelum.demo', 'secret'));
  });
});

describe('password step header (Part B polish)', () => {
  beforeEach(() => { authState.session = null; authState.signIn = vi.fn(); });
  const at = (search = '') => render(<MemoryRouter initialEntries={[`/login${search}`]}><LoginPage /></MemoryRouter>);
  const continueWith = (email) => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  };
  const form = () => document.querySelector('form');

  it('shows the hospital crest and name in the card header, with no For line', () => {
    at();
    continueWith('knh.bloodbank@caelum.demo');
    expect(within(form()).getByRole('img', { name: 'Kenyatta National Hospital logo' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kenyatta National Hospital');
    expect(within(form()).getByText('Sign in to CAELUM Facility')).toBeInTheDocument();
    expect(within(form()).queryByText(/^For /)).toBeNull();
    expect(within(form()).queryByText('Sign in with your hospital account')).toBeNull();
    expect(screen.getByText('Signing in as')).toBeInTheDocument();
  });

  it('uses the initials badge in the header for a hospital without a logo', () => {
    at();
    continueWith('thika.lab@caelum.demo');
    expect(within(form()).getByRole('img', { name: 'Thika Level 5 Hospital' })).toHaveTextContent('TL5');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Thika Level 5 Hospital');
  });

  it('keeps the CAELUM header on the email step and when the email matched no hospital', () => {
    at('?facility=90001');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CAELUM Facility');
    continueWith('someone@hospital.ke');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CAELUM Facility');
    expect(within(form()).queryByRole('img', { name: /logo$/ })).toBeNull();
  });
});

