import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../../../shared/errors/AppError';

let s3ClientInstance: S3Client | null = null;

const getS3Client = () => {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3ClientInstance;
};

export class S3Service {
  static async generatePresignedUrl(filename: string, contentType: string) {
    try {
      const key = `uploads/${Date.now()}-${filename}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'snapy-cdn',
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
      const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN || 'lokaya-cdn'}/${key}`;

      return { uploadUrl: url, signedUrl: url, publicUrl, key, fileKey: key };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new AppError('Failed to generate upload URL', 500);
    }
  }
}
