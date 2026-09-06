import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  me,
  forgotPassword,
  resetPassword,
  logout,
  purgeAllUsers
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.post('/purge-all-users', purgeAllUsers);

export default router;
