import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PasswordInput from './PasswordInput';

const setup = () => {
  const onSubmit = vi.fn((e) => e.preventDefault());
  render(
    <form onSubmit={onSubmit}>
      <label htmlFor="pw">Password</label>
      <PasswordInput id="pw" autoComplete="current-password" defaultValue="secret" />
      <button type="submit">Go</button>
    </form>,
  );
  return { onSubmit, input: screen.getByLabelText('Password') };
};

describe('PasswordInput', () => {
  it('is hidden by default with the right autocomplete', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    const t = screen.getByRole('button', { name: 'Show password' });
    expect(t).toHaveAttribute('aria-pressed', 'false');
    expect(t).toHaveAttribute('type', 'button');
  });

  it('toggles type, label and aria-pressed without submitting', () => {
    const { input, onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    const t = screen.getByRole('button', { name: 'Hide password' });
    expect(t).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(t);
    expect(input).toHaveAttribute('type', 'password');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('is a focusable native button with a focus ring', () => {
    setup();
    const t = screen.getByRole('button', { name: 'Show password' });
    t.focus();
    expect(document.activeElement).toBe(t);
    expect(t).not.toHaveAttribute('tabindex', '-1');
    expect(t.className).toMatch(/focus-visible:ring-2/);
  });

  it('goes back to hidden after the form submits', () => {
    const { input, onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    fireEvent.click(screen.getByText('Go'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'false');
  });
});
