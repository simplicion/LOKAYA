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

// CORS Preflight OPTIONS for streaming view endpoints
const handleMediaCors = (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.sendStatus(204);
};

mediaRouter.options('/view', handleMediaCors);
mediaRouter.options('/view/*', handleMediaCors);
mediaRouter.options('/stream/*', handleMediaCors);

// Direct upload endpoint (Bypasses any browser CORS restrictions)
mediaRouter.post('/upload', upload.single('file'), mediaController.uploadFile.bind(mediaController));

// Streaming view endpoint with query param support (?key=...)
mediaRouter.get('/view', mediaController.viewFile.bind(mediaController));
mediaRouter.get('/view/*', mediaController.viewFile.bind(mediaController));

// Hierarchical direct stream endpoint (supports full relative HLS segment and playlist resolution)
mediaRouter.get('/stream/*', mediaController.viewFile.bind(mediaController));

// Presigned URL generation for direct client uploads
mediaRouter.post('/presigned-url', mediaController.getPresignedUrl.bind(mediaController));
mediaRouter.post('/process', mediaController.startProcessing.bind(mediaController));



