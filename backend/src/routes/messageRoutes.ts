import { Router } from 'express';
import {
  editMessage,
  deleteMessage,
  toggleReaction,
  toggleStarMessage,
  getStarredMessages
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/starred', getStarredMessages);
router.put('/:id', editMessage);
router.post('/:id/delete', deleteMessage);
router.post('/:id/reactions', toggleReaction);
router.put('/:id/star', toggleStarMessage);

export default router;
