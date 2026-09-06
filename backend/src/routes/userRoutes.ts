import { Router } from 'express';
import {
  searchUsers,
  getUserProfile,
  updateProfile,
  blockUser,
  unblockUser,
  getBlockedUsers
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/blocked', getBlockedUsers);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);
router.post('/:id/block', blockUser);
router.delete('/:id/block', unblockUser);

export default router;
