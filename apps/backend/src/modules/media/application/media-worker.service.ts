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
if (ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}
if (ffprobeInstaller && ffprobeInstaller.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '7158d01d5e0dd9e7f5be050ed3717b14';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '0fc5788e73739c590c9458c2953ebcb1';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a';
const BUCKET = process.env.R2_BUCKET_NAME || 'lokaya-cdn';
const BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:4002/api/v1';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface MediaJobPayload {
  mediaId: string;
  fileKey: string;
  type: 'VIDEO' | 'IMAGE';
  rawUrl?: string;
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
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(15);
      resolve(metadata?.format?.duration || 15);
    });
  });
}

/**
 * Generates progressive Fast-Start MP4 with moov atom at byte 0 for instant progressive Range playback
 */
async function processVideoToFastStartMP4(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .outputOptions([
        '-c:v h264',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-c:a aac',
        '-b:a 128k',
        '-ar 48000',
        '-pix_fmt yuv420p'
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.warn('[MediaWorker] Fast-start MP4 generation warning:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Generates low-latency 2-second HLS stream from raw video
 * Target resolutions: 720p and 360p
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
        '-crf 22',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 2200k',
        '-maxrate 2500k',
        '-bufsize 3500k',
        '-b:a 128k',
        '-hls_time 2',
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
        '-crf 24',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 800k',
        '-maxrate 900k',
        '-bufsize 1200k',
        '-b:a 96k',
        '-hls_time 2',
        '-hls_playlist_type vod',
        '-hls_segment_filename', path.join(outputDir, '360p_%03d.ts')
      ])
      .on('end', () => {
        const masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2200000,RESOLUTION=1280x720\n720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8";
        fs.writeFileSync(masterPlaylistPath, masterContent);
        resolve(masterPlaylistPath);
      })
      .on('error', (err) => {
        console.error(`FFmpeg HLS error for ${mediaId}:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * Executes full video/image optimization, chunking, and raw cleanup
 */
export async function processMediaJob(data: MediaJobPayload) {
  const { mediaId, fileKey, type, rawUrl } = data;
  console.log(`[MediaWorker] Starting processing for mediaId: ${mediaId} (${fileKey})`);

  const tempDir = path.join(os.tmpdir(), `media_${mediaId}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const rawFilePath = path.join(tempDir, `raw_${path.basename(fileKey || 'file')}`);

  try {
    // 1. Set status to PROCESSING
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { status: 'PROCESSING' }
    });

    // 2. Download raw file from R2
    console.log(`[MediaWorker] Downloading raw file ${fileKey}...`);
    await downloadFromS3(BUCKET, fileKey, rawFilePath);

    let finalUrl = '';

    if (type === 'VIDEO') {
      const duration = await getVideoDuration(rawFilePath);
      console.log(`[MediaWorker] Video duration: ${Math.round(duration)}s`);

      // 3a. Transcode into 2s low-latency HLS chunks + Fast-Start MP4
      console.log(`[MediaWorker] Transcoding video to 2s HLS chunks and Fast-Start MP4...`);
      try {
        await processVideoToHLS(rawFilePath, tempDir, mediaId);
        
        // Also generate fast-start progressive MP4 fallback
        const fastStartMp4Path = path.join(tempDir, 'optimized.mp4');
        await processVideoToFastStartMP4(rawFilePath, fastStartMp4Path).catch(() => {});

        // Upload all generated files (.ts, .m3u8, .mp4) to R2
        const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.ts') || f.endsWith('.m3u8') || f.endsWith('.mp4'));
        console.log(`[MediaWorker] Uploading ${files.length} processed video files to R2...`);

        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const s3Key = `processed/videos/${mediaId}/${file}`;
          let contentType = 'video/mp4';
          if (file.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
          else if (file.endsWith('.ts')) contentType = 'video/MP2T';

          await uploadToS3(BUCKET, s3Key, filePath, contentType);
        }

        finalUrl = `${BASE_URL}/media/stream/processed/videos/${mediaId}/master.m3u8`;
      } catch (ffmpegErr) {
        console.warn(`[MediaWorker] FFmpeg transcoding fallback:`, ffmpegErr);
        // Fallback to streaming raw file via stream proxy
        finalUrl = `${BASE_URL}/media/stream/${fileKey}`;
      }
    } else {
      // 3b. Optimize image
      try {
        const outPath = path.join(tempDir, 'optimized.webp');
        await sharp(rawFilePath)
          .webp({ quality: 82 })
          .toFile(outPath);

        const s3Key = `processed/images/${mediaId}/optimized.webp`;
        await uploadToS3(BUCKET, s3Key, outPath, 'image/webp');
        finalUrl = `${BASE_URL}/media/stream/processed/images/${mediaId}/optimized.webp`;
      } catch (imgErr) {
        console.warn(`[MediaWorker] Image sharp fallback:`, imgErr);
        finalUrl = `${BASE_URL}/media/stream/${fileKey}`;
      }
    }

    // 4. Update DB to READY
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        status: 'READY',
        url: finalUrl || rawUrl || `${BASE_URL}/media/stream/${fileKey}`
      }
    });

    // 5. Delete raw file from R2 once chunks are safely stored
    if (type === 'VIDEO' && finalUrl.includes('master.m3u8')) {
      console.log(`[MediaWorker] Cleaning up raw video file ${fileKey} from R2...`);
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: fileKey,
        }));
      } catch (delErr) {
        console.warn(`[MediaWorker] Notice deleting raw video:`, delErr);
      }
    }

    console.log(`[MediaWorker] Successfully processed media ${mediaId}`);
  } catch (error: any) {
    console.error(`[MediaWorker] Processing error for ${mediaId}:`, error);
    // Keep it playable with original stream URL if possible
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        status: 'READY', // Set ready so user's video is never stuck broken
        url: rawUrl || `${BASE_URL}/media/stream/${fileKey}`,
        errorMsg: error?.message || undefined,
      }
    }).catch(() => {});
  } finally {
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

// BullMQ Worker initialization
let worker: Worker | null = null;
try {
  const redisConnection = createRedisConnection();
  worker = new Worker<MediaJobPayload>(
    'media-processing',
    async (job: Job<MediaJobPayload>) => {
      await processMediaJob(job.data);
    },
    { connection: redisConnection as any }
  );

  worker.on('error', (err) => {
    console.warn('[MediaWorker] BullMQ Worker warning:', err?.message || err);
  });
} catch (err) {
  console.warn('[MediaWorker] BullMQ Redis connection omitted:', err);
}

export const mediaWorker = worker;
