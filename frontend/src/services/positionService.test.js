import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getPositions } from './positionService';

vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getPositions', () => {
    it('returns the positions on success', async () => {
        axios.get.mockResolvedValue({ data: [{ id: 1, title: 'Senior Full-Stack Engineer' }] });

        const result = await getPositions();

        expect(result).toEqual([{ id: 1, title: 'Senior Full-Stack Engineer' }]);
    });

    // Igual que en los demás servicios: un fallo de red real (axios sin
    // `response`, solo `request`) se marca para que quien lo muestre
    // (Positions.tsx vía useAsyncData) pueda dar un mensaje traducido en
    // vez del "Network Error" interno.
    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.get.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(getPositions()).rejects.toMatchObject({ isNetworkError: true });
    });

    it('does not tag a real server error response as a network error', async () => {
        axios.get.mockRejectedValue({ request: {}, response: { data: { message: 'Internal error' } } });

        const error = await getPositions().catch((e) => e);
        expect(error.isNetworkError).toBeUndefined();
    });
});
