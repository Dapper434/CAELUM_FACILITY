import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const http = vi.hoisted(() => ({ post: vi.fn(async () => ({ id: 'r1' })), get: vi.fn(), patch: vi.fn() }));
vi.mock('../lib/apiClient', () => ({ http }));
import NewRequestForm from './NewRequestForm';
import SuggestedRequestCard from './SuggestedRequestCard';
import { requestsApi } from '../api/requests';
import { inventoryApi } from '../api/inventory';
import { isValidBloodGroup } from '../utils/bloodGroup';

describe('blood group guard', () => {
  beforeEach(() => http.post.mockClear());

  it('rejects empty, "null" and "undefined"', async () => {
    ['', 'null', 'undefined', null, undefined, 'o-'].forEach((g) => expect(isValidBloodGroup(g)).toBe(false));
    expect(isValidBloodGroup('AB+')).toBe(true);
    await expect(requestsApi.create({ blood_group: 'null', units_requested: 1 })).rejects.toMatchObject({ code: 'validation_error' });
    await expect(inventoryApi.add([{ blood_group: 'undefined' }])).rejects.toMatchObject({ code: 'validation_error' });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('blocks the new request form until a group is picked', async () => {
    render(<NewRequestForm />);
    fireEvent.click(screen.getByText('Create request'));
    expect(screen.getByText('Pick a blood group.')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Blood group'), { target: { value: 'A+' } });
    expect(screen.queryByText('Pick a blood group.')).toBeNull();
    fireEvent.click(screen.getByText('Create request'));
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/requests', expect.objectContaining({ blood_group: 'A+' })));
  });

  it('disables confirming a suggestion with no blood group', () => {
    render(<SuggestedRequestCard request={{ id: 's1', request_code: 'REQ-S', blood_group: null, units_requested: 2, urgency: 'routine' }} />);
    expect(screen.getByText(/no valid blood group/)).toBeInTheDocument();
    expect(screen.getByText('Confirm').closest('button')).toBeDisabled();
    fireEvent.click(screen.getByText('Confirm'));
    expect(http.post).not.toHaveBeenCalled();
  });
});
