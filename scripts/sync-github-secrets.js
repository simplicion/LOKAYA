const { execSync } = require('child_process');

const secrets = {
  DATABASE_URL: "postgresql://pitchin_admin:Pitchin180Admin!23@pitchin-db.csne8mek4dog.us-east-1.rds.amazonaws.com:5432/lokaya_db?sslmode=require",
  DIRECT_URL: "postgresql://pitchin_admin:Pitchin180Admin!23@pitchin-db.csne8mek4dog.us-east-1.rds.amazonaws.com:5432/lokaya_db?sslmode=require",
  REDIS_URL: "rediss://red-dafi1ftbedkc739bbovg:YP3C2SCtDTlvZL2un0PgQ12OUAiSlcud@virginia-keyvalue.render.com:6379",
  JWT_SECRET: "cce165b61b8a327dba615226ec9d266e4401434b552aa7b36eb5125e378ac0a0",
  JWT_REFRESH_SECRET: "0288403b131b825471e4122027b90c31f29cedaf84b37d34d78de2db79ee0094",
  SUPER_ADMIN_JWT_SECRET: "93a5fca43bd1644fa9b08aa171d8591119c2b54050f9122fd6938be7eb86a0ca",
  CLIENT_URL: "https://lokaya.shop",
  FRONTEND_URL: "https://lokaya.shop,https://www.lokaya.shop,https://admin.lokaya.shop",
  ADMIN_URL: "https://admin.lokaya.shop",
  APP_BASE_URL: "https://api.lokaya.shop",
  BACKEND_API_URL: "https://api.lokaya.shop/api/v1",
  ADMIN_EMAIL: "admin@lokaya.shop",
  ADMIN_PASSWORD: "AdminPassword123!",
  GOOGLE_CLIENT_ID: "924762867355-6lfudinvj763rl4usv256svhtu3muemi.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "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",
  RAZORPAY_KEY_ID: "rzp_live_TJ4cJdMCagilvq",
  RAZORPAY_KEY_SECRET: "c5RbhL5k0DIQKTDOQot3cyei",
  RAZORPAY_WEBHOOK_SECRET: "rzp_webhook_secret_placeholder",
  CLOUDFLARE_ACCOUNT_ID: "7158d01d5e0dd9e7f5be050ed3717b14",
  R2_ACCOUNT_ID: "7158d01d5e0dd9e7f5be050ed3717b14",
  R2_ACCESS_KEY_ID: "0fc5788e73739c590c9458c2953ebcb1",
  R2_SECRET_ACCESS_KEY: "6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a",
  R2_BUCKET_NAME: "lokaya-cdn",
  NEXT_PUBLIC_CDN_DOMAIN: "https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com/lokaya-cdn",
  NEXT_PUBLIC_API_URL: "https://api.lokaya.shop/api/v1",
  NEXT_PUBLIC_BACKEND_URL: "https://api.lokaya.shop",
  NEXT_PUBLIC_SOCKET_URL: "https://api.lokaya.shop",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "924762867355-6lfudinvj763rl4usv256svhtu3muemi.apps.googleusercontent.com",
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_TJ4cJdMCagilvq",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_USER: "simplicion.com@gmail.com",
  SMTP_PASS: "vbaqzpfnslttmcaf",
  SMTP_SECURE: "true",
  SMTP_FROM_EMAIL: "simplicion.com@gmail.com"
};

console.log(`Starting GitHub Secrets sync (${Object.keys(secrets).length} secrets)...`);

let successCount = 0;
let failCount = 0;

for (const [key, value] of Object.entries(secrets)) {
  try {
    execSync(`gh secret set ${key} --body "${value.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    console.log(`✓ Set secret: ${key}`);
    successCount++;
  } catch (err) {
    console.error(`✗ Failed to set secret: ${key} - ${err.message}`);
    failCount++;
  }
}

console.log(`\n==================================================`);
console.log(`Secrets sync complete: ${successCount} succeeded, ${failCount} failed.`);
console.log(`==================================================`);
