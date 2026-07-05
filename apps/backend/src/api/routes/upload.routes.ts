import { Router } from 'express';
import { getPresignedUrl } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/presigned-url', authenticate, getPresignedUrl);

export default router;
