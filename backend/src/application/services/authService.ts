import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Employee } from '../../domain/models/Employee';

// Igual que ValidationError (ver validator.ts): con "target": "es5" en
// tsconfig.json, `extends Error` rompe la cadena de prototipos y
// `error instanceof AuthError` daría `false` en quien la capture.
export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

export type AuthTokenPayload = {
    sub: number;
    role: string;
    companyId: number;
};

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Fallar rápido y de forma explícita en vez de firmar tokens con
        // `undefined` (jsonwebtoken lo permite y produciría tokens válidos
        // para cualquiera que conozca el string "undefined").
        throw new Error('JWT_SECRET no está configurado (ver backend/.env.example)');
    }
    return secret;
};

const TOKEN_TTL = '8h';

export const signToken = (employee: { id: number; role: string; companyId: number }): string => {
    const payload: AuthTokenPayload = { sub: employee.id, role: employee.role, companyId: employee.companyId };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL });
};

export const verifyToken = (token: string): AuthTokenPayload => {
    return jwt.verify(token, getJwtSecret()) as unknown as AuthTokenPayload;
};

// Un único mensaje genérico para "email no existe", "email existe pero sin
// contraseña asignada", "empleado desactivado" y "contraseña incorrecta":
// distinguirlos permitiría enumerar qué correos están dados de alta.
const INVALID_CREDENTIALS_MESSAGE = 'Email o contraseña incorrectos';

export const login = async (email: string, password: string) => {
    if (!email || !password) {
        throw new AuthError(INVALID_CREDENTIALS_MESSAGE);
    }

    const employee = await Employee.findByEmail(email);

    if (!employee || !employee.isActive || !employee.password) {
        throw new AuthError(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(password, employee.password);
    if (!passwordMatches) {
        throw new AuthError(INVALID_CREDENTIALS_MESSAGE);
    }

    const token = signToken({ id: employee.id as number, role: employee.role, companyId: employee.companyId });

    return {
        token,
        employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            companyId: employee.companyId,
        },
    };
};
