import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';
dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

const s3Client = new S3Client({
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

async function run() {
  const cmd = new PutObjectCommand({ 
    Bucket: process.env.R2_BUCKET_NAME || 'snapick', 
    Key: 'test-upload.jpg', 
    ContentType: 'image/jpeg' 
  });
  const url = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
  console.log("Generated URL:", url);
  
  // Test 1: fetch WITH matching content type
  console.log("\nTesting WITH Content-Type...");
  const res1 = await fetch(url, { method: 'PUT', body: 'image_data', headers: { 'Content-Type': 'image/jpeg' } });
  console.log("Status:", res1.status, res1.statusText);
  if (res1.status !== 200) console.log(await res1.text());

  // Test 2: fetch WITHOUT matching content type
  console.log("\nTesting WITHOUT Content-Type...");
  const cmd2 = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || 'snapick', Key: 'test-upload2.jpg' });
  const url2 = await getSignedUrl(s3Client, cmd2, { expiresIn: 3600 });
  const res2 = await fetch(url2, { method: 'PUT', body: 'image_data', headers: { 'Content-Type': 'image/jpeg' } });
  console.log("Status:", res2.status, res2.statusText);
  if (res2.status !== 200) console.log(await res2.text());
}

run().catch(console.error);
