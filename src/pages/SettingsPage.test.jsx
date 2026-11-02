import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toContactPayload, validateContact } from '../utils/contact';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ facilityId: 'f1' }) }));
vi.mock('../api/facilities', () => ({ facilitiesApi: { get: vi.fn(), updateContact: vi.fn() } }));
import { facilitiesApi } from '../api/facilities';
import SettingsPage from './SettingsPage';

const facility = { id: 'f1', name: 'Mama Lucy', contact_name: 'Officer', contact_phone: null, address: null };

describe('contact helpers', () => {
  it('validates phone and lengths', () => {
    expect(validateContact({ contact_name: '', contact_phone: '+254 700 000 102', address: '' })).toEqual({});
    expect(validateContact({ contact_name: 'x'.repeat(121), contact_phone: 'abc', address: 'y'.repeat(301) }))
      .toEqual({ contact_name: expect.any(String), contact_phone: expect.any(String), address: expect.any(String) });
  });
  it('sends only changes and nulls blanks', () => {
    expect(toContactPayload(facility, { contact_name: '', contact_phone: '+254700000102', address: '' }))
      .toEqual({ contact_name: null, contact_phone: '+254700000102' });
  });
});

describe('SettingsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); facilitiesApi.get.mockResolvedValue(facility); });

  it('loads values and saves changes', async () => {
    facilitiesApi.updateContact.mockResolvedValue({ ...facility, address: 'Embakasi' });
    render(<SettingsPage />);
    expect(await screen.findByDisplayValue('Officer')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Embakasi' } });
    fireEvent.click(screen.getByText('Save contact details'));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(facilitiesApi.updateContact).toHaveBeenCalledWith('f1', { address: 'Embakasi' });
  });

  it('blocks invalid phone numbers', async () => {
    render(<SettingsPage />);
    await screen.findByDisplayValue('Officer');
    fireEvent.change(screen.getByLabelText('Contact phone'), { target: { value: 'call me' } });
    fireEvent.click(screen.getByText('Save contact details'));
    expect(await screen.findByText(/Use digits/)).toBeInTheDocument();
    expect(facilitiesApi.updateContact).not.toHaveBeenCalled();
  });

  it('shows API errors', async () => {
    facilitiesApi.updateContact.mockRejectedValue(Object.assign(new Error('Bad value'), { code: 'validation_error' }));
    render(<SettingsPage />);
    await screen.findByDisplayValue('Officer');
    fireEvent.change(screen.getByLabelText('Contact name'), { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Save contact details'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('validation_error'));
  });
});
