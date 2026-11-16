import React from 'react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, Outlet } from 'react-router';
import ErrorBoundary, { RouteErrorBoundary } from './ErrorBoundary';

function Boom() {
  throw new Error('boom');
}
function Safe() {
  return <p>safe page</p>;
}

describe('ErrorBoundary', () => {
  const orig = window.location;
  let errSpy;

  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });

  it('renders a calm fallback when a child throws, and Reload calls location.reload', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...orig, reload } });
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalled();
  });

  it('resets the per-route boundary when navigating away', () => {
    render(
      <MemoryRouter initialEntries={['/boom']}>
        <Link to="/safe">go</Link>
        <Routes>
          <Route element={<RouteErrorBoundary><Outlet /></RouteErrorBoundary>}>
            <Route path="boom" element={<Boom />} />
            <Route path="safe" element={<Safe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByText('safe page')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
