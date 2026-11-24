import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    me: { role: 'facility', email: 'donor@caelum.demo' },
    facility: { name: 'Kapsabet', level_label: 'Level 4' },
    signOut: vi.fn(),
    error: null,
  }),
}));

import Layout, { NAV_ITEMS } from './Layout';

function show(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          {NAV_ITEMS.map(({ to }) => (
            <Route key={to} path={to === '/' ? '' : to.slice(1)} element={<p>page {to}</p>} />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('mobile nav', () => {
  beforeEach(() => { document.body.style.overflow = ''; });

  it('opens and closes the drawer, lists every link, and closes on Escape', () => {
    show('/');
    expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const dialog = screen.getByRole('dialog', { name: /navigation menu/i });
    expect(dialog).toBeInTheDocument();
    const nav = within(dialog).getByRole('navigation', { name: /hospital operations/i });
    NAV_ITEMS.forEach(({ label }) => expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();
  });

  it('closes the drawer when a nav link is followed', () => {
    show('/');
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Inventory' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('page /inventory')).toBeInTheDocument();
  });

  it('keeps account details behind the profile menu and closes it with Escape', () => {
    show('/');
    const trigger = screen.getByRole('button', { name: /account menu for donor@caelum.demo/i });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger);
    const details = screen.getByRole('group', { name: /account details/i });
    expect(within(details).getByText('donor@caelum.demo')).toBeInTheDocument();
    expect(within(details).getByText('Kapsabet')).toBeInTheDocument();
    const menu = within(details).getByRole('menu', { name: /account actions/i });
    expect(within(menu).getByRole('menuitem', { name: /account settings/i })).toHaveAttribute('href', '/settings');
    expect(within(menu).getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: /account details/i })).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
