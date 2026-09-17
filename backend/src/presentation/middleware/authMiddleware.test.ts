import { Request, Response } from 'express';
import { requireAuth } from './authMiddleware';
import { verifyToken } from '../../application/services/authService';

jest.mock('../../application/services/authService');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}) as unknown as Response;

const mockNext = () => jest.fn();

describe('requireAuth', () => {
    it('attaches the decoded payload to req.employee and calls next() for a valid Bearer token', () => {
        const req = { headers: { authorization: 'Bearer valid-token' } } as unknown as Request;
        const res = mockResponse();
        const next = mockNext();
        (verifyToken as jest.Mock).mockReturnValue({ sub: 1, role: 'Interviewer', companyId: 1 });

        requireAuth(req, res, next);

        expect(req.employee).toEqual({ sub: 1, role: 'Interviewer', companyId: 1 });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when there is no Authorization header', () => {
        const req = { headers: {} } as unknown as Request;
        const res = mockResponse();
        const next = mockNext();

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
        expect(verifyToken).not.toHaveBeenCalled();
    });

    it('returns 401 when the scheme is not "Bearer"', () => {
        const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } } as unknown as Request;
        const res = mockResponse();
        const next = mockNext();

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(verifyToken).not.toHaveBeenCalled();
    });

    it('returns 401 (the same generic message) when the token is invalid or expired', () => {
        const req = { headers: { authorization: 'Bearer expired-or-tampered' } } as unknown as Request;
        const res = mockResponse();
        const next = mockNext();
        (verifyToken as jest.Mock).mockImplementation(() => {
            throw new Error('jwt expired');
        });

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });
});
