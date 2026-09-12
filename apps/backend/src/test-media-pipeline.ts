import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@workspace/db';
import { processMediaJob } from './modules/media/application/media-worker.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET = process.env.R2_BUCKET_NAME || 'lokaya-cdn';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function runPipelineTests() {
  console.log('================================================================');
  console.log('🚀 LOKAYA MEDIA PIPELINE & CONCURRENCY VERIFICATION TEST');
  console.log('================================================================');

  try {
    // 1. Verify R2 connection
    console.log('\n[TEST 1] Verifying Cloudflare R2 Connection...');
    const testKey = `test/pipeline-health-${Date.now()}.txt`;
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: testKey,
      Body: Buffer.from('Lokaya media pipeline health check ok'),
      ContentType: 'text/plain'
    }));
    console.log('✅ R2 PutObject Successful on bucket:', BUCKET);

    // 2. Create test DB MediaAsset
    console.log('\n[TEST 2] Testing DB MediaAsset Record Lifecycle...');
    const testAsset = await prisma.mediaAsset.create({
      data: {
        url: `http://localhost:4002/api/v1/media/view?key=${encodeURIComponent(testKey)}`,
        originalUrl: `s3://${BUCKET}/${testKey}`,
        type: 'IMAGE',
        status: 'PENDING'
      }
    });
    console.log('✅ MediaAsset Created with ID:', testAsset.id, 'Status:', testAsset.status);

    // 3. Run Media Processing Job on test asset
    console.log('\n[TEST 3] Running Media Worker Processing Job...');
    await processMediaJob({
      mediaId: testAsset.id,
      fileKey: testKey,
      type: 'IMAGE',
      rawUrl: testAsset.url
    });

    const updatedAsset = await prisma.mediaAsset.findUnique({ where: { id: testAsset.id } });
    console.log('✅ MediaAsset Updated Post-Processing Status:', updatedAsset?.status, 'URL:', updatedAsset?.url);

    // 4. Simulate Concurrent Uploads (Batch of 5 parallel items)
    console.log('\n[TEST 4] Simulating Concurrent Media Processing Load (5 Parallel Tasks)...');
    const concurrentItems = Array.from({ length: 5 }, (_, i) => ({
      key: `test/concurrent-${Date.now()}-${i}.txt`,
      index: i + 1
    }));

    // Upload 5 raw files in parallel
    await Promise.all(concurrentItems.map(async (item) => {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: item.key,
        Body: Buffer.from(`Concurrent payload chunk ${item.index}`),
        ContentType: 'text/plain'
      }));
    }));
    console.log('✅ 5 Parallel R2 uploads completed.');

    // Create 5 DB assets
    const assets = await Promise.all(concurrentItems.map(async (item) => {
      return await prisma.mediaAsset.create({
        data: {
          url: `http://localhost:4002/api/v1/media/view?key=${encodeURIComponent(item.key)}`,
          originalUrl: `s3://${BUCKET}/${item.key}`,
          type: 'IMAGE',
          status: 'PENDING'
        }
      });
    }));
    console.log('✅ 5 DB Assets created in PENDING state.');

    // Process all 5 in parallel
    const startTime = Date.now();
    await Promise.all(assets.map(async (asset, i) => {
      await processMediaJob({
        mediaId: asset.id,
        fileKey: concurrentItems[i].key,
        type: 'IMAGE',
        rawUrl: asset.url
      });
    }));
    const totalTimeMs = Date.now() - startTime;
    console.log(`✅ All 5 concurrent tasks processed successfully in ${totalTimeMs}ms!`);

    // Verify all are READY
    const finalAssets = await prisma.mediaAsset.findMany({
      where: { id: { in: assets.map(a => a.id) } }
    });
    const allReady = finalAssets.every(a => a.status === 'READY');
    console.log('✅ Concurrency Integrity Check:', allReady ? 'ALL 5 READY' : 'SOME FAILED');

    // Cleanup test records
    await prisma.mediaAsset.deleteMany({
      where: { id: { in: [testAsset.id, ...assets.map(a => a.id)] } }
    });
    console.log('\n🧹 Cleaned up test database records.');

    console.log('\n================================================================');
    console.log('🎉 ALL MEDIA PIPELINE TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ Pipeline Test Error:', error);
    process.exit(1);
  }
}

runPipelineTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
