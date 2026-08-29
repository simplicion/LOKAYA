import { Request, Response } from 'express';
import { MediaService } from '../application/media.service';

const mediaService = new MediaService();

export class MediaController {
  async getPresignedUrl(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const { filename, contentType } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ error: 'Filename and contentType are required' });
      }
      
      const { signedUrl, fileKey } = await mediaService.getPresignedUrl(userId, filename, contentType);
      
      res.json({ signedUrl, fileKey });
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
