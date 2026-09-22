import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { MediaController } from './media.controller';

export const mediaRouter: Router = Router();
const mediaController = new MediaController();

// Use disk storage to stream directly to temporary files instead of bloating Node.js V8 memory
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'lokaya-upload-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB production grade limit
  },
});

// Middleware to gracefully handle multer errors (e.g. file size limit exceeded)
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum allowed size is 100MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Server error during upload: ${err.message}` });
    }
    next();
  });
};

// Middleware to gracefully handle multi-image photoshoot uploads
const handlePhotoshootUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 2)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum allowed size is 50MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Server error during upload: ${err.message}` });
    }
    next();
  });
};

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
mediaRouter.post('/upload', handleUpload, mediaController.uploadFile.bind(mediaController));

// AI Product Studio Photoshoot (Accepts 1-2 product photos, returns 5 studio shots)
mediaRouter.post('/ai-photoshoot', handlePhotoshootUpload, mediaController.generateAiPhotoshoot.bind(mediaController));
mediaRouter.post('/ai-photoshoot-stream', handlePhotoshootUpload, mediaController.streamAiPhotoshoot.bind(mediaController));

// Streaming view endpoint with query param support (?key=...)
mediaRouter.get('/view', mediaController.viewFile.bind(mediaController));
mediaRouter.get('/view/*', mediaController.viewFile.bind(mediaController));

// Hierarchical direct stream endpoint (supports full relative HLS segment and playlist resolution)
mediaRouter.get('/stream/*', mediaController.viewFile.bind(mediaController));

// Presigned URL generation for direct client uploads
mediaRouter.post('/presigned-url', mediaController.getPresignedUrl.bind(mediaController));
mediaRouter.post('/process', mediaController.startProcessing.bind(mediaController));




