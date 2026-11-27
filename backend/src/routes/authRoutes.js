import { Router } from 'express';
import {
  login,
  refreshSession,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { validateBody } from '../middleware/validateRequest.js';
import { loginSchema, changePasswordSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', authLimiter, refreshSession);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, validateBody(changePasswordSchema), changePassword);

export default router;
