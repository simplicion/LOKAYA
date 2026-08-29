import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@workspace/db';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const RAW_BUCKET = process.env.AWS_S3_RAW_BUCKET || 'snapick-raw-media';
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const mediaQueue = new Queue('media-processing', { connection: redisConnection as any });

export class MediaService {
  async getPresignedUrl(userId: string, filename: string, contentType: string) {
    const ext = filename.split('.').pop();
    const fileKey = `raw/${userId}/${uuidv4()}.${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: RAW_BUCKET,
      Key: fileKey,
      ContentType: contentType,
    });
    
    // URL expires in 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    return { signedUrl, fileKey };
  }
  
  async startProcessing(userId: string, fileKey: string, type: 'VIDEO' | 'IMAGE') {
    // Create DB Record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        url: '', // Will be updated by worker
        originalUrl: `s3://${RAW_BUCKET}/${fileKey}`,
        type,
        status: 'PENDING'
      }
    });
    
    // Add to BullMQ
    await mediaQueue.add('process-media', {
      mediaId: mediaAsset.id,
      fileKey,
      type
    });
    
    return mediaAsset;
  }
}
