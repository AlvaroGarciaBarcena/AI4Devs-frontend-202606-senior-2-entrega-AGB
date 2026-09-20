import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { login, logout, getStoredAuth } from './authService';

vi.mock('axios');

const STORAGE_KEY = 'lti_auth';

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('login', () => {
    it('stores the token and employee in localStorage and returns the employee', async () => {
        axios.post.mockResolvedValue({
            data: {
                token: 'a.jwt.token',
                employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
            },
        });

        const result = await login('alice.johnson@lti.com', 'Changeme123!');

        expect(result).toEqual({ id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 });
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({
            token: 'a.jwt.token',
            employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
        });
    });

    it('throws only the server detail, without a prefix, and stores nothing on failure', async () => {
        axios.post.mockRejectedValue({
            response: { data: { message: 'Email o contraseña incorrectos' } },
        });

        await expect(login('alice.johnson@lti.com', 'wrong')).rejects.toThrow('Email o contraseña incorrectos');
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // Caso real que motivó esto: el backend caído devuelve axios "Network
    // Error" en error.message (sin respuesta en absoluto, solo
    // error.request) -- se marca para que Login.jsx pueda dar un mensaje
    // traducido y accionable en vez de ese texto interno en inglés.
    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.post.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(login('alice.johnson@lti.com', 'x')).rejects.toMatchObject({ isNetworkError: true });
    });

    it('does not tag a real credentials rejection as a network error', async () => {
        axios.post.mockRejectedValue({
            request: {},
            response: { data: { message: 'Email o contraseña incorrectos' } },
        });

        const error = await login('alice.johnson@lti.com', 'wrong').catch((e) => e);
        expect(error.isNetworkError).toBeUndefined();
    });
});

describe('logout', () => {
    it('removes the stored session', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'x', employee: {} }));

        logout();

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});

describe('getStoredAuth', () => {
    it('returns null when there is nothing stored', () => {
        expect(getStoredAuth()).toBeNull();
    });

    it('returns the parsed session when present', () => {
        const session = { token: 'x', employee: { id: 1, name: 'Alice Johnson' } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

        expect(getStoredAuth()).toEqual(session);
    });

    it('returns null instead of throwing for a corrupted value', () => {
        localStorage.setItem(STORAGE_KEY, '{not valid json');

        expect(getStoredAuth()).toBeNull();
    });
});
