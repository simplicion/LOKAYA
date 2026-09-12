import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@workspace/db';

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
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      }
    });
  }
  return s3ClientInstance;
};

const getBucket = () => process.env.R2_BUCKET_NAME || 'lokaya-cdn';

/**
 * StoryRetentionService: Purges archived stories older than 30 days.
 * Permanently deletes media objects from Cloudflare R2 bucket and purges DB records.
 */
export class StoryRetentionService {
  static async purgeExpiredStories(): Promise<{ purgedCount: number; deletedR2Objects: number; errors: string[] }> {
    const now = new Date();
    const errors: string[] = [];
    let purgedCount = 0;
    let deletedR2Objects = 0;

    console.log(`[RetentionCron] Running 30-day story retention cleanup check at ${now.toISOString()}...`);

    try {
      // Find all stories past their purgeAt date that have not been purged
      const expiredStories = await prisma.story.findMany({
        where: {
          purgeAt: { lte: now },
          isPurged: false,
        },
        include: {
          highlightItems: true
        }
      });

      console.log(`[RetentionCron] Found ${expiredStories.length} expired archived stories.`);

      for (const story of expiredStories) {
        try {
          // If story is included in an active highlight, preserve it so highlights don't break
          if (story.highlightItems && story.highlightItems.length > 0) {
            console.log(`[RetentionCron] Story ${story.id} is part of a Highlight; preserving media.`);
            continue;
          }

          // 1. Delete media object from Cloudflare R2
          let fileKey = story.fileKey;
          if (!fileKey && story.mediaUrl) {
            // Attempt to extract key from URL
            const urlObj = new URL(story.mediaUrl, 'http://localhost');
            const keyParam = urlObj.searchParams.get('key');
            if (keyParam) {
              fileKey = keyParam;
            } else if (story.mediaUrl.includes('uploads/')) {
              fileKey = 'uploads/' + story.mediaUrl.split('uploads/')[1];
            }
          }

          if (fileKey) {
            try {
              const deleteCmd = new DeleteObjectCommand({
                Bucket: getBucket(),
                Key: fileKey,
              });
              await getS3Client().send(deleteCmd);
              deletedR2Objects++;
              console.log(`[RetentionCron] Deleted R2 object for story ${story.id} (key: ${fileKey})`);
            } catch (s3Err: any) {
              console.warn(`[RetentionCron] Failed to delete R2 object for story ${story.id}:`, s3Err?.message || s3Err);
              errors.push(`S3 delete failed for story ${story.id}: ${s3Err?.message}`);
            }
          }

          // 2. Delete story record and cascading relations
          await prisma.story.delete({
            where: { id: story.id }
          });
          purgedCount++;
        } catch (storyErr: any) {
          console.error(`[RetentionCron] Error purging story ${story.id}:`, storyErr);
          errors.push(`Purge error for ${story.id}: ${storyErr?.message}`);
        }
      }

      console.log(`[RetentionCron] Completed. Purged ${purgedCount} stories, removed ${deletedR2Objects} R2 objects.`);
    } catch (err: any) {
      console.error('[RetentionCron] Fatal retention cron error:', err);
      errors.push(err?.message || 'Unknown error');
    }

    return { purgedCount, deletedR2Objects, errors };
  }

  /**
   * Initializes the recurring cron job.
   * Runs once every hour in production worker.
   */
  static startScheduledJob(intervalMs = 60 * 60 * 1000) {
    console.log(`[RetentionCron] Scheduled 30-day story purge job initialized (interval: ${intervalMs / 1000}s).`);
    // Run initial pass after 10 seconds to clean any backlog
    setTimeout(() => {
      this.purgeExpiredStories().catch(err => console.error('[RetentionCron] Initial run error:', err));
    }, 10000);

    // Recurring interval
    setInterval(() => {
      this.purgeExpiredStories().catch(err => console.error('[RetentionCron] Recurring run error:', err));
    }, intervalMs);
  }
}
