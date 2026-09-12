import { Worker, Job } from 'bullmq';
import { prisma } from '@workspace/db';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// @ts-ignore
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import sharp from 'sharp';
import { createRedisConnection } from '../../../shared/services/redis.service';

// Set FFmpeg path from installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const redisConnection = createRedisConnection();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const RAW_BUCKET = process.env.AWS_S3_RAW_BUCKET || 'snapick-raw-media';
const PROCESSED_BUCKET = process.env.AWS_S3_PROCESSED_BUCKET || 'snapick-processed-media';
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || `https://${PROCESSED_BUCKET}.s3.amazonaws.com`;

interface MediaJobPayload {
  mediaId: string;
  fileKey: string;
  type: 'VIDEO' | 'IMAGE';
}

async function downloadFromS3(bucket: string, key: string, destPath: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  if (!response.Body) throw new Error('Empty body from S3');
  // @ts-ignore
  await pipeline(response.Body, fs.createWriteStream(destPath));
}

async function uploadToS3(bucket: string, key: string, filePath: string, contentType: string) {
  const fileStream = fs.createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3Client.send(command);
}


async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Generates HLS stream from raw video
 * Target resolutions: 720p (Max) and 360p
 */
async function processVideoToHLS(inputPath: string, outputDir: string, mediaId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    
    ffmpeg(inputPath)
      // 720p Variant
      .output(path.join(outputDir, '720p.m3u8'))
      .outputOptions([
        '-vf scale=-2:720',
        '-c:a aac',
        '-ar 48000',
        '-c:v h264',
        '-profile:v main',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 2500k',
        '-maxrate 2675k',
        '-bufsize 3750k',
        '-b:a 128k',
        '-hls_time 10',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputDir, '720p_%03d.ts')
      ])
      // 360p Variant
      .output(path.join(outputDir, '360p.m3u8'))
      .outputOptions([
        '-vf scale=-2:360',
        '-c:a aac',
        '-ar 48000',
        '-c:v h264',
        '-profile:v main',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 800k',
        '-maxrate 856k',
        '-bufsize 1200k',
        '-b:a 96k',
        '-hls_time 10',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputDir, '360p_%03d.ts')
      ])
      .on('end', () => {
        // Generate Master Playlist manually
        const masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8";
        fs.writeFileSync(masterPlaylistPath, masterContent);
        resolve(masterPlaylistPath);
      })
      .on('error', (err) => {
        console.error(`FFmpeg error for ${mediaId}:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * The BullMQ Worker instance
 */
export const mediaWorker = new Worker<MediaJobPayload>(
  'media-processing',
  async (job: Job<MediaJobPayload>) => {
    const { mediaId, fileKey, type } = job.data;
    console.log(`[MediaWorker] Starting job ${job.id} for media ${mediaId}`);
    
    const tempDir = path.join(os.tmpdir(), `media_${mediaId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const rawFilePath = path.join(tempDir, `raw_${path.basename(fileKey)}`);
    
    try {
      // 1. Update status to PROCESSING
      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { status: 'PROCESSING' }
      });
      
      // 2. Download raw file from S3
      console.log(`[MediaWorker] Downloading ${fileKey}...`);
      await downloadFromS3(RAW_BUCKET, fileKey, rawFilePath);
      
      let finalUrl = '';
      
      
      if (type === 'VIDEO') {
        const duration = await getVideoDuration(rawFilePath);
        console.log(`[MediaWorker] Video duration: ${duration}s`);
        if (duration > 120) {
          throw new Error('Video duration exceeds maximum allowed length of 120 seconds.');
        }
        
        // 3a. Process Video

        console.log(`[MediaWorker] Transcoding video to HLS...`);
        await processVideoToHLS(rawFilePath, tempDir, mediaId);
        
        // Upload all generated HLS files (.ts and .m3u8)
        const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.ts') || f.endsWith('.m3u8'));
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const s3Key = `processed/videos/${mediaId}/${file}`;
          const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T';
          
          await uploadToS3(PROCESSED_BUCKET, s3Key, filePath, contentType);
        }
        
        finalUrl = `${CDN_DOMAIN}/processed/videos/${mediaId}/master.m3u8`;
        
      } else if (type === 'IMAGE') {
        // 3b. Process Image
        console.log(`[MediaWorker] Compressing image...`);
        const outPath = path.join(tempDir, 'optimized.webp');
        
        await sharp(rawFilePath)
          .webp({ quality: 80 })
          .toFile(outPath);
          
        const s3Key = `processed/images/${mediaId}/optimized.webp`;
        await uploadToS3(PROCESSED_BUCKET, s3Key, outPath, 'image/webp');
        
        finalUrl = `${CDN_DOMAIN}/${s3Key}`;
      }
      
      // 4. Finalize Database
      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { 
          status: 'READY',
          url: finalUrl 
        }
      });
      
      // 5. Cleanup Raw S3 File (Delete to save costs)
      await s3Client.send(new DeleteObjectCommand({
        Bucket: RAW_BUCKET,
        Key: fileKey
      }));
      
      console.log(`[MediaWorker] Finished job ${job.id} successfully!`);
      
    } catch (error: any) {
      console.error(`[MediaWorker] Job ${job.id} failed:`, error);
      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { 
          status: 'FAILED',
          errorMsg: error.message || 'Unknown error'
        }
      });
      throw error;
    } finally {
      // Cleanup local temp files
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  },
  { connection: redisConnection as any }
);
