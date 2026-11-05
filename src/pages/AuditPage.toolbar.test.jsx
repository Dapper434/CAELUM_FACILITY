import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ facilityId: 'f1' }) }));
vi.mock('../api/facilities', () => ({
  facilitiesApi: {
    audit: vi.fn(async () => ({ data: [], meta: {} })),
    auditSummary: vi.fn(async () => null),
    auditExport: vi.fn(),
  },
}));
import AuditPage from './AuditPage';

describe('Audit toolbar', () => {
  it('keeps Search and Filter as separate controls that can wrap', async () => {
    render(<AuditPage />);
    const search = await screen.findByLabelText('Search');
    const filter = screen.getByRole('button', { name: 'Filter' });
    expect(search).toBeInTheDocument();
    expect(filter).toBeInTheDocument();
    expect(search.parentElement).toContainElement(filter);
    expect(search.className).toMatch(/flex-1/);
    expect(search.className).toMatch(/min-w-/);
  });
});
