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
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  }
});

async function run() {
  console.log("Generating presigned URL...");
  const cmd = new PutObjectCommand({ 
    Bucket: process.env.R2_BUCKET_NAME || 'snapick', 
    Key: 'test-upload.txt', 
    ContentType: 'text/plain' 
  });
  
  const url = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
  console.log("URL:", url);
  
  console.log("Attempting upload via fetch...");
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: 'Hello World',
      headers: {
        'Content-Type': 'text/plain',
      }
    });
    
    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run().catch(console.error);
