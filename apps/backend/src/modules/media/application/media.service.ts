import { S3Client, PutObjectCommand, PutBucketCorsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Queue } from 'bullmq';
import { prisma } from '@workspace/db';
import { v4 as uuidv4 } from 'uuid';
import { createRedisConnection } from '../../../shared/services/redis.service';

let s3ClientInstance: S3Client | null = null;
const getS3Client = () => {
  if (!s3ClientInstance) {
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '7158d01d5e0dd9e7f5be050ed3717b14';
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '0fc5788e73739c590c9458c2953ebcb1';
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a';

    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      }
    });

    // Ensure CORS on R2 bucket asynchronously
    ensureR2Cors().catch(err => console.warn('Could not auto-apply R2 CORS:', err));
  }
  return s3ClientInstance;
};

const getBucket = () => process.env.R2_BUCKET_NAME || 'lokaya-cdn';
const redisConnection = createRedisConnection();
export const mediaQueue = new Queue('media-processing', { connection: redisConnection as any });

export const ensureR2Cors = async () => {
  try {
    const s3 = getS3Client();
    const bucket = getBucket();
    const cmd = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
            AllowedHeaders: ['*'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    await s3.send(cmd);
    console.log(`[R2] CORS configuration active on bucket: ${bucket}`);
  } catch (err: any) {
    console.warn('[R2] CORS configuration notice:', err?.message || err);
  }
};

export class MediaService {
  async getObjectStream(fileKey: string) {
    const bucket = getBucket();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    return await getS3Client().send(command);
  }

  async uploadFile(userId: string, file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const fileKey = `uploads/${userId}/${uuidv4()}.${ext}`;
    const bucket = getBucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await getS3Client().send(command);

    // Provide reliable access URL via streaming proxy or signed URL
    const baseUrl = process.env.BACKEND_API_URL || 'http://localhost:4002/api/v1';
    const viewUrl = `${baseUrl}/media/view?key=${encodeURIComponent(fileKey)}`;

    return {
      success: true,
      fileKey,
      url: viewUrl,
      publicUrl: viewUrl,
    };
  }

  async getPresignedUrl(userId: string, filename: string, contentType: string) {
    const ext = filename.split('.').pop();
    const fileKey = `uploads/${userId}/${uuidv4()}.${ext}`;
    const bucket = getBucket();
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });
    
    // URL expires in 15 minutes
    const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });
    const baseUrl = process.env.BACKEND_API_URL || 'http://localhost:4002/api/v1';
    const viewUrl = `${baseUrl}/media/view?key=${encodeURIComponent(fileKey)}`;
    
    return { signedUrl, fileKey, uploadUrl: signedUrl, publicUrl: viewUrl };
  }
  
  async startProcessing(userId: string, fileKey: string, type: 'VIDEO' | 'IMAGE') {
    // Create DB Record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        url: '', // Will be updated by worker
        originalUrl: `s3://${getBucket()}/${fileKey}`,
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
