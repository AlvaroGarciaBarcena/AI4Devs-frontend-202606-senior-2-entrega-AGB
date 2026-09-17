import { Request, Response } from 'express';
import { login, AuthError } from '../../application/services/authService';

export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        res.status(200).json(result);
    } catch (error: unknown) {
        if (error instanceof AuthError) {
            res.status(401).json({ message: error.message });
        } else {
            console.error('Error inesperado en el login:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
