import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useEscapeBack } from './useEscapeBack';

function Probe() {
  const [open, setOpen] = useState(true);
  useEscapeBack(() => setOpen(false), { enabled: open });
  return (
    <div>
      {open ? <p>detail</p> : <p>list</p>}
      <input aria-label="Note" />
    </div>
  );
}

describe('useEscapeBack', () => {
  it('closes on Escape, but not when a field is focused or a dialog is open', () => {
    render(<Probe />);
    fireEvent.keyDown(screen.getByLabelText('Note'), { key: 'Escape' });
    expect(screen.getByText('detail')).toBeInTheDocument();

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText('detail')).toBeInTheDocument();
    dialog.remove();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText('list')).toBeInTheDocument();
  });
});
