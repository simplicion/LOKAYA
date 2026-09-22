const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const apkSource = path.resolve(__dirname, '../../../apps/user-app/android/app/build/outputs/apk/debug/app-debug.apk');
const apkPublicDestDir = path.resolve(__dirname, '../../../apps/user-app/web/public/downloads');
const apkPublicDest = path.join(apkPublicDestDir, 'lokaya.apk');

if (!fs.existsSync(apkSource)) {
  console.error('Source APK not found at:', apkSource);
  process.exit(1);
}

// 1. Copy to web public folder
if (!fs.existsSync(apkPublicDestDir)) {
  fs.mkdirSync(apkPublicDestDir, { recursive: true });
}
fs.copyFileSync(apkSource, apkPublicDest);
const stats = fs.statSync(apkPublicDest);
console.log(`Copied APK to ${apkPublicDest} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

// 2. Upload to Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '0fc5788e73739c590c9458c2953ebcb1',
    secretAccessKey: '6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a'
  }
});

async function uploadToR2() {
  const fileBuffer = fs.readFileSync(apkSource);
  const key = 'downloads/lokaya.apk';
  
  console.log(`Uploading APK to R2 bucket 'lokaya-cdn' key '${key}'...`);
  await s3Client.send(new PutObjectCommand({
    Bucket: 'lokaya-cdn',
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/vnd.android.package-archive',
    ContentDisposition: 'attachment; filename="lokaya.apk"',
    CacheControl: 'public, max-age=3600'
  }));

  console.log('✅ Upload to Cloudflare R2 successful!');
  
  const head = await s3Client.send(new HeadObjectCommand({
    Bucket: 'lokaya-cdn',
    Key: key
  }));
  console.log(`Verified R2 object size: ${(head.ContentLength / (1024 * 1024)).toFixed(2)} MB`);
}

uploadToR2().catch(err => {
  console.error('R2 upload failed:', err);
  process.exit(1);
});
