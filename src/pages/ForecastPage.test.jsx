import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ApiError } from '../lib/http';

const forecastApi = vi.hoisted(() => ({ get: vi.fn(), history: vi.fn(), run: vi.fn(), alerts: vi.fn() }));
vi.mock('../api/forecast', () => ({ forecastApi }));
vi.mock('../api/requests', () => ({ requestsApi: { list: vi.fn(async () => []) } }));
import ForecastPage, { DEFAULT_FORECAST_FILTERS, isInsufficientHistory } from './ForecastPage';

const show = () => render(<MemoryRouter><ForecastPage /></MemoryRouter>);

describe('ForecastPage', () => {
  beforeEach(() => {
    Object.values(forecastApi).forEach((f) => f.mockReset());
    forecastApi.alerts.mockResolvedValue([]);
    forecastApi.history.mockResolvedValue({ from: 'a', to: 'b', total_issued: 0, average_daily: 0, days_with_data: 0, history: [] });
  });

  it('defaults to O- packed_rbc', async () => {
    forecastApi.get.mockResolvedValue({ units_on_hand: 3, days_of_cover: 2, average_daily_demand: 1, daily_demand: [], method: 'm', history_points: 28 });
    show();
    expect(DEFAULT_FORECAST_FILTERS).toEqual({ blood_group: 'O-', product_type: 'packed_rbc' });
    await waitFor(() => expect(forecastApi.get).toHaveBeenCalledWith({ blood_group: 'O-', product_type: 'packed_rbc' }));
    expect(forecastApi.history).toHaveBeenCalledWith({ blood_group: 'O-', product_type: 'packed_rbc', days: 28 });
  });

  it('shows 422 insufficient_history as a friendly empty state', async () => {
    forecastApi.get.mockRejectedValue(new ApiError(422, 'insufficient_history', 'No demand_logs rows'));
    forecastApi.history.mockRejectedValue(new ApiError(422, 'insufficient_history', 'No demand_logs rows'));
    show();
    expect(await screen.findAllByText('Not enough history yet for this group.')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('still shows other errors as errors', async () => {
    forecastApi.get.mockRejectedValue(new ApiError(500, 'internal_error', 'Internal server error'));
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    expect(screen.queryByText('Not enough history yet for this group.')).toBeNull();
  });

  it('only treats 422 insufficient_history as empty', () => {
    expect(isInsufficientHistory(new ApiError(422, 'insufficient_history'))).toBe(true);
    expect(isInsufficientHistory(new ApiError(422, 'validation_error'))).toBe(false);
    expect(isInsufficientHistory(new ApiError(400, 'insufficient_history'))).toBe(false);
    expect(isInsufficientHistory(null)).toBe(false);
  });
});
