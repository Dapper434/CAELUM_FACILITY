import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AuditTrail from './AuditTrail';

const entries = [
  { id: 'e1', seq: 1, action: 'inventory.corrected', at: '2026-11-01T00:00:00Z', actor_role: 'facility', entity_type: 'inventory_unit', entity_id: 'u1', payload: { reason: 'typo' }, hash: 'abc' },
];

describe('AuditTrail detail', () => {
  it('opens a drawer with Back to audit trail and closes on Escape', () => {
    render(<AuditTrail entries={entries} group={false} />);
    fireEvent.click(screen.getByText('Stock corrected'));
    expect(screen.getByRole('dialog', { name: 'Audit entry detail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to audit trail' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Audit entry detail' })).toBeNull();
  });
});
