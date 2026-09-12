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
      let rawKey = (req.params[0] as string) || (req.query.key as string) || '';
      try {
        if (rawKey.includes('%')) {
          rawKey = decodeURIComponent(rawKey);
        }
      } catch {
        // Fallback if decode fails
      }
      
      // Clean leading slashes
      let key = rawKey.replace(/^\/+/, '');
      if (!key) {
        return res.status(400).send('File key is required');
      }

      // Determine correct MIME type based on file extension
      let contentType = 'application/octet-stream';
      const lowerKey = key.toLowerCase();
      if (lowerKey.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (lowerKey.endsWith('.ts')) {
        contentType = 'video/MP2T';
      } else if (lowerKey.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (lowerKey.endsWith('.webm')) {
        contentType = 'video/webm';
      } else if (lowerKey.endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (lowerKey.endsWith('.png')) {
        contentType = 'image/png';
      }

      const range = req.headers.range;
      const response = await mediaService.getObjectStream(key, range);
      
      res.setHeader('Content-Type', response.ContentType || contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');

      if (response.ContentRange) {
        res.status(206);
        res.setHeader('Content-Range', response.ContentRange);
      }
      if (response.ContentLength !== undefined) {
        res.setHeader('Content-Length', response.ContentLength);
      }

      const stream = response.Body as any;
      if (stream && typeof stream.pipe === 'function') {
        res.on('close', () => {
          if (typeof stream.destroy === 'function') {
            stream.destroy();
          }
        });
        stream.on('error', (err: any) => {
          console.error('[MediaStream] Error on stream pipe:', err?.message || err);
          if (!res.headersSent) {
            res.status(500).send('Stream error');
          } else {
            res.end();
          }
        });
        stream.pipe(res);
      } else {
        const buffer = await response.Body?.transformToByteArray();
        res.end(Buffer.from(buffer || []));
      }
    } catch (error: any) {
      console.error('Error streaming file from R2:', error?.message || error);
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
