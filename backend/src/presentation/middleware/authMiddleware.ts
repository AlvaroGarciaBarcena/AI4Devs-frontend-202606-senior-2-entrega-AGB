import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../application/services/authService';

// Middleware de autorización: exige un token JWT válido en
// `Authorization: Bearer <token>` y adjunta el empleado autenticado a
// `req.employee` (ver la extensión de Express.Request en index.ts). No
// distingue en la respuesta entre "sin cabecera", "formato inválido",
// "token caducado" o "firma inválida" — de cara al cliente todos son un
// 401 genérico; el motivo real solo se registra en el log del servidor.
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const [scheme, token] = authHeader?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        req.employee = verifyToken(token);
        next();
    } catch (error) {
        console.error('Token inválido:', error instanceof Error ? error.message : error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
