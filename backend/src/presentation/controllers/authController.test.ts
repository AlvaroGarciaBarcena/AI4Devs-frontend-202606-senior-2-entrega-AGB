import { Request, Response } from 'express';
import { loginController } from './authController';
import { login, AuthError } from '../../application/services/authService';

// Auto-mockear el módulo entero también sustituiría `AuthError` por una
// clase simulada de Jest, y `new AuthError('...')` dejaría de fijar
// `.message` de verdad (mismo tipo de problema que documenta
// validator.ts con `Object.setPrototypeOf`, pero por mock en vez de por
// `target: es5`). Se mockea solo `login`, conservando la clase real.
jest.mock('../../application/services/authService', () => ({
    ...jest.requireActual('../../application/services/authService'),
    login: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}) as unknown as Response;

describe('loginController', () => {
    it('returns 200 with the token and employee on success', async () => {
        const req = { body: { email: 'alice.johnson@lti.com', password: 'Changeme123!' } } as unknown as Request;
        const res = mockResponse();
        (login as jest.Mock).mockResolvedValue({
            token: 'a.jwt.token',
            employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
        });

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            token: 'a.jwt.token',
            employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
        });
    });

    it('returns 401 with the AuthError message for invalid credentials', async () => {
        const req = { body: { email: 'alice.johnson@lti.com', password: 'wrong' } } as unknown as Request;
        const res = mockResponse();
        (login as jest.Mock).mockRejectedValue(new AuthError('Email o contraseña incorrectos'));

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email o contraseña incorrectos' });
    });

    it('returns a generic 500 (not the raw error) for an unexpected failure', async () => {
        const req = { body: { email: 'alice.johnson@lti.com', password: 'Changeme123!' } } as unknown as Request;
        const res = mockResponse();
        (login as jest.Mock).mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
});
