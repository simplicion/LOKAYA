import * as dotenv from 'dotenv';
dotenv.config();

async function testCors() {
  const url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/test-cors`;
  
  console.log("Testing OPTIONS against:", url);
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3002',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:");
    res.headers.forEach((value, key) => console.log(`${key}: ${value}`));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testCors();
