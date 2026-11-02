import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAsync } from './useAsync';

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useAsync polling', () => {
  afterEach(() => { vi.useRealTimers(); setHidden(false); });

  it('pauses while hidden and resumes when visible', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue(1);
    renderHook(() => useAsync(fn, [], { interval: 1000 }));
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fn).toHaveBeenCalledTimes(2);
    act(() => setHidden(true));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(fn).toHaveBeenCalledTimes(2);
    await act(async () => setHidden(false));
    expect(fn).toHaveBeenCalledTimes(3);
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('stops polling on unmount', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue(1);
    const { unmount } = renderHook(() => useAsync(fn, [], { interval: 1000 }));
    unmount();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
