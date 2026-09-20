import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsyncData } from './useAsyncData';

describe('useAsyncData', () => {
  it('starts in loading state and resolves with the fetched data', async () => {
    const fetchFn = vi.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useAsyncData(fetchFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.error).toBe('');
  });

  it('uses the Error message when the fetch rejects with a real Error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsyncData(fetchFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('falls back to fallbackErrorMessage when the rejection is not an Error', async () => {
    const fetchFn = vi.fn().mockRejectedValue('not an Error instance');
    const { result } = renderHook(() =>
      useAsyncData(fetchFn, [], { fallbackErrorMessage: 'algo salió mal' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('algo salió mal');
  });

  it('does not call fetchFn and reports loading: false when enabled is false', async () => {
    const fetchFn = vi.fn().mockResolvedValue('should not be called');
    const { result } = renderHook(() => useAsyncData(fetchFn, [], { enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('re-fetches when a dependency changes', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result, rerender } = renderHook(({ dep }) => useAsyncData(fetchFn, [dep]), {
      initialProps: { dep: 1 },
    });

    await waitFor(() => expect(result.current.data).toBe('first'));

    rerender({ dep: 2 });
    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('ignores a stale response that resolves after a newer one (race condition guard)', async () => {
    // La primera llamada tarda más que la segunda: sin la bandera
    // `cancelled` del hook, su resultado ("stale") pisaría al de la
    // segunda llegada ("fresh") por llegar después en tiempo real.
    let resolveFirst: (value: string) => void;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchFn = vi.fn().mockReturnValueOnce(firstPromise).mockResolvedValueOnce('fresh');

    const { result, rerender } = renderHook(({ dep }) => useAsyncData(fetchFn, [dep]), {
      initialProps: { dep: 1 },
    });

    rerender({ dep: 2 });
    await waitFor(() => expect(result.current.data).toBe('fresh'));

    resolveFirst!('stale');
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.data).toBe('fresh');
  });
});
