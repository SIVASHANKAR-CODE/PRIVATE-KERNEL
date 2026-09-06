import { Router } from 'express';
import { uploadMiddleware, handleUpload, serveFile } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// File serving can be accessed directly by authenticated users or authenticated image tags
router.get('/:filename', serveFile);

// Uploads require authentication
router.post('/', authenticate, uploadMiddleware, handleUpload);

export default router;
