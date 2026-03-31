import { Router } from 'express';
import { login, register, refresh, me, logout, getStaff } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { loginSchema, registerSchema } from '../types';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/register', validateBody(registerSchema), register);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get('/staff', getStaff);

export default router;
