import { Router } from 'express';
import {
  getConversations,
  getOrCreateDirectConversation,
  getConversationById,
  togglePin,
  toggleArchive,
  toggleMute,
  searchChats
} from '../controllers/conversationController.js';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.post('/direct', getOrCreateDirectConversation);
router.get('/search', searchChats);
router.get('/:id', getConversationById);
router.put('/:id/pin', togglePin);
router.put('/:id/archive', toggleArchive);
router.put('/:id/mute', toggleMute);

// Message nested routes
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

export default router;
