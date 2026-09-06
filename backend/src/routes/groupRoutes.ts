import { Router } from 'express';
import {
  createGroup,
  addMembers,
  removeMember,
  updateMemberRole,
  updateGroupDetails
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createGroup);
router.put('/:id', updateGroupDetails);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/members/:memberId/role', updateMemberRole);

export default router;
