import bcrypt from 'bcryptjs';
import { login, signToken, verifyToken, AuthError } from './authService';
import { Employee } from '../../domain/models/Employee';

jest.mock('../../domain/models/Employee');
jest.mock('bcryptjs');

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
});

const mockEmployee = (overrides: Partial<Employee> = {}) => ({
    id: 1,
    companyId: 1,
    name: 'Alice Johnson',
    email: 'alice.johnson@lti.com',
    password: 'hashed-password',
    role: 'Interviewer',
    isActive: true,
    ...overrides,
});

describe('login', () => {
    it('returns a token and the employee (without the password hash) on success', async () => {
        (Employee.findByEmail as jest.Mock).mockResolvedValue(mockEmployee());
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await login('alice.johnson@lti.com', 'Changeme123!');

        expect(result.token).toEqual(expect.any(String));
        expect(result.employee).toEqual({
            id: 1,
            name: 'Alice Johnson',
            email: 'alice.johnson@lti.com',
            role: 'Interviewer',
            companyId: 1,
        });
        expect((result.employee as any).password).toBeUndefined();
    });

    it('rejects with the same generic message when the email does not exist', async () => {
        (Employee.findByEmail as jest.Mock).mockResolvedValue(null);

        await expect(login('unknown@lti.com', 'whatever')).rejects.toThrow(AuthError);
        await expect(login('unknown@lti.com', 'whatever')).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('rejects with the same generic message when the password is wrong (never reveals which check failed)', async () => {
        (Employee.findByEmail as jest.Mock).mockResolvedValue(mockEmployee());
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(login('alice.johnson@lti.com', 'wrong')).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('rejects a deactivated employee even with the correct password', async () => {
        (Employee.findByEmail as jest.Mock).mockResolvedValue(mockEmployee({ isActive: false }));
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await expect(login('alice.johnson@lti.com', 'Changeme123!')).rejects.toThrow('Email o contraseña incorrectos');
        // No llega ni a comparar la contraseña: se corta en cuanto se sabe que no puede autenticarse.
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('rejects an employee that has no password assigned yet', async () => {
        (Employee.findByEmail as jest.Mock).mockResolvedValue(mockEmployee({ password: null }));

        await expect(login('alice.johnson@lti.com', 'anything')).rejects.toThrow('Email o contraseña incorrectos');
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('rejects when email or password is missing, without querying the database', async () => {
        await expect(login('', 'whatever')).rejects.toThrow(AuthError);
        expect(Employee.findByEmail).not.toHaveBeenCalled();
    });
});

describe('signToken / verifyToken', () => {
    it('round-trips the employee id, role and companyId', () => {
        const token = signToken({ id: 7, role: 'Hiring Manager', companyId: 2 });
        const payload = verifyToken(token);

        expect(payload).toEqual(expect.objectContaining({ sub: 7, role: 'Hiring Manager', companyId: 2 }));
    });

    it('throws for a token signed with a different secret', () => {
        const token = signToken({ id: 7, role: 'Hiring Manager', companyId: 2 });
        process.env.JWT_SECRET = 'a-different-secret';

        expect(() => verifyToken(token)).toThrow();
    });
});
