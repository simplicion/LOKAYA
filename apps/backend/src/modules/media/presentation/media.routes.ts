import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller';

export const mediaRouter: Router = Router();
const mediaController = new MediaController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Direct upload endpoint (Bypasses any browser CORS restrictions)
mediaRouter.post('/upload', upload.single('file'), mediaController.uploadFile.bind(mediaController));

// Streaming view endpoint (Streams from Cloudflare R2 with correct Content-Type)
mediaRouter.get('/view', mediaController.viewFile.bind(mediaController));

// Presigned URL generation for direct client uploads
mediaRouter.post('/presigned-url', mediaController.getPresignedUrl.bind(mediaController));
mediaRouter.post('/process', mediaController.startProcessing.bind(mediaController));


