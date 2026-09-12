import { Request, Response } from 'express';
import { MediaService } from '../application/media.service';

const mediaService = new MediaService();

export class MediaController {
  async uploadFile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await mediaService.uploadFile(userId, file);
      res.json(result);
    } catch (error: any) {
      console.error('Error uploading file directly to R2:', error);
      res.status(500).json({ error: error?.message || 'Failed to upload file to storage' });
    }
  }

  async viewFile(req: Request, res: Response) {
    try {
      const key = (req.query.key as string) || (req.params[0] as string);
      if (!key) {
        return res.status(400).send('File key is required');
      }

      const response = await mediaService.getObjectStream(key);
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const stream = response.Body as any;
      if (stream && typeof stream.pipe === 'function') {
        stream.pipe(res);
      } else {
        const buffer = await response.Body?.transformToByteArray();
        res.end(Buffer.from(buffer || []));
      }
    } catch (error: any) {
      console.error('Error streaming file from R2:', error);
      res.status(404).send('File not found');
    }
  }

  async getPresignedUrl(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const { filename, contentType } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ error: 'Filename and contentType are required' });
      }
      
      const result = await mediaService.getPresignedUrl(userId, filename, contentType);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error generating pre-signed URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  }
  
  async startProcessing(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const { fileKey, type } = req.body;
      
      if (!fileKey || !type) {
        return res.status(400).json({ error: 'fileKey and type are required' });
      }
      
      const mediaAsset = await mediaService.startProcessing(userId, fileKey, type);
      
      res.json({ success: true, mediaAsset });
    } catch (error: any) {
      console.error('Error starting processing:', error);
      res.status(500).json({ error: 'Failed to start processing' });
    }
  }
}
