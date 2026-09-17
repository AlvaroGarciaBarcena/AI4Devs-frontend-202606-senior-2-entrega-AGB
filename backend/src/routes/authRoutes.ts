import { Router } from 'express';
import { loginController } from '../presentation/controllers/authController';

const router = Router();

router.post('/login', loginController);

export default router;
