import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getPositions, addInterviewStep } from './positionService';
import { API_BASE_URL } from '../config';

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

describe('addInterviewStep', () => {
    it('POSTs the phase name and returns the created step', async () => {
        axios.post.mockResolvedValue({
            data: { message: 'ok', data: { id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 } },
        });

        const result = await addInterviewStep(1, 'Live coding test');

        expect(axios.post).toHaveBeenCalledWith(`${API_BASE_URL}/position/1/interviewflow/steps`, { name: 'Live coding test' });
        expect(result).toEqual({ message: 'ok', data: { id: 50, interviewFlowId: 10, interviewTypeId: 99, name: 'Live coding test', orderIndex: 3 } });
    });

    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.post.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(addInterviewStep(1, 'Live coding test')).rejects.toMatchObject({ isNetworkError: true });
    });

    // Sin prefijo propio, a diferencia del resto de funciones de este
    // fichero (ver el comentario junto a addInterviewStep): quien lo
    // muestre (PositionProcess.tsx) añade su propio prefijo traducido.
    it('throws only the server detail, without any prefix, when the phase name is rejected', async () => {
        axios.post.mockRejectedValue({ response: { data: { error: 'Phase name is required' } } });

        const error = await addInterviewStep(1, '').catch((e) => e);
        expect(error.message).toBe('Phase name is required');
    });
});
