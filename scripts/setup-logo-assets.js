const path = require('path');
const sharp = require(path.resolve(__dirname, '../apps/backend/node_modules/sharp'));
const fs = require('fs');

const userUploadedPath = 'C:/Users/saavi/.gemini/antigravity-ide/brain/c4fee0e3-d8e4-43f8-90e5-e0c732e04de5/.user_uploaded/media_1789857790987.png';

async function generateAssets() {
  console.log('Generating logo, icon, and favicon assets...');

  // 1. Read and analyze uploaded logo
  const original = sharp(userUploadedPath);
  const meta = await original.metadata();
  console.log('Original dimensions:', meta.width, 'x', meta.height);

  // Trim extraneous margins to get the tight bounding box of the logo
  const trimmedBuffer = await sharp(userUploadedPath)
    .trim()
    .toBuffer();
  
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log('Trimmed dimensions:', trimmedMeta.width, 'x', trimmedMeta.height);

  // Destination directories
  const userWebPublic = path.resolve('apps/user-app/web/public');
  const userWebApp = path.resolve('apps/user-app/web/src/app');
  const adminWebPublic = path.resolve('apps/admin-web/public');
  const adminWebApp = path.resolve('apps/admin-web/src/app');

  [userWebPublic, userWebApp, adminWebPublic, adminWebApp].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // 2. Create High-Resolution SVG for the horizontal logo with pure white background
  // Geometry based on the uploaded logo:
  // Font: Plus Jakarta Sans / system-ui bold 900
  // L, KAYA: #111111 (crisp black)
  // O: #FF5400 / #FF4500 (crisp vibrant orange circle with central cutout matching uploaded logo)
  const fullLogoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <rect width="100%" height="100%" fill="#FFFFFF" />
  <g transform="translate(20, 20)">
    <!-- L -->
    <text x="5" y="66" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="72" fill="#111111" letter-spacing="-2">L</text>
    <!-- O with bold orange ring -->
    <circle cx="95" cy="42" r="30" fill="none" stroke="#FF5400" stroke-width="16" />
    <!-- KAYA -->
    <text x="145" y="66" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="72" fill="#111111" letter-spacing="-2">KAYA</text>
  </g>
</svg>`.trim();

  // 3. Create High-Resolution SVG for square icon / favicon with pure white background
  const squareIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="64" />
  <g transform="translate(36, 176)">
    <!-- L -->
    <text x="15" y="140" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="160" fill="#111111" letter-spacing="-4">L</text>
    <!-- O with bold orange ring -->
    <circle cx="205" cy="88" r="66" fill="none" stroke="#FF5400" stroke-width="36" />
    <!-- Small subtle KAYA subtext for balanced brand identification -->
    <text x="295" y="140" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="160" fill="#111111" letter-spacing="-4">K</text>
  </g>
</svg>`.trim();

  // Also a full horizontal lockup centered on square for large icon
  const squareFullIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="100%" height="100%" fill="#FFFFFF" />
  <g transform="translate(56, 216)">
    <!-- L -->
    <text x="0" y="70" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="80" fill="#111111" letter-spacing="-2">L</text>
    <!-- O with bold orange ring -->
    <circle cx="102" cy="44" r="33" fill="none" stroke="#FF5400" stroke-width="18" />
    <!-- KAYA -->
    <text x="156" y="70" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="80" fill="#111111" letter-spacing="-2">KAYA</text>
  </g>
</svg>`.trim();

  // Also a dedicated crisp Favicon SVG (standard 32x32 / 64x64 view) with pure white background
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="14" />
  <g transform="translate(6, 12)">
    <!-- L -->
    <text x="2" y="32" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="34" fill="#111111">L</text>
    <!-- O in bright orange -->
    <circle cx="36" cy="20" r="15" fill="none" stroke="#FF5400" stroke-width="8" />
  </g>
</svg>`.trim();

  // Write SVGs
  const svgTargets = [
    { dir: userWebPublic, name: 'logo.svg', content: fullLogoSvg },
    { dir: userWebPublic, name: 'favicon.svg', content: faviconSvg },
    { dir: userWebPublic, name: 'icon.svg', content: squareFullIconSvg },
    { dir: adminWebPublic, name: 'logo.svg', content: fullLogoSvg },
    { dir: adminWebPublic, name: 'favicon.svg', content: faviconSvg },
    { dir: adminWebPublic, name: 'icon.svg', content: squareFullIconSvg },
  ];

  for (const t of svgTargets) {
    fs.writeFileSync(path.join(t.dir, t.name), t.content, 'utf8');
    console.log(`Wrote SVG: ${t.name} -> ${t.dir}`);
  }

  // 4. Generate raster PNGs from SVG using sharp
  // Horizontal logo with white background: 840 x 240 (crisp 2x Retina)
  const logoPngBuffer = await sharp(Buffer.from(fullLogoSvg))
    .resize(840, 240)
    .png({ quality: 100 })
    .toBuffer();

  // 512x512 app icon with white background
  const icon512PngBuffer = await sharp(Buffer.from(squareFullIconSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toBuffer();

  // 192x192 app icon with white background
  const icon192PngBuffer = await sharp(Buffer.from(squareFullIconSvg))
    .resize(192, 192)
    .png({ quality: 100 })
    .toBuffer();

  // 32x32 & 48x48 for Favicon
  const favicon32Png = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();

  const favicon48Png = await sharp(Buffer.from(faviconSvg))
    .resize(48, 48)
    .png()
    .toBuffer();

  // Write PNG assets
  const pngOutputs = [
    // user-app public
    { file: path.join(userWebPublic, 'logo.png'), buffer: logoPngBuffer },
    { file: path.join(userWebPublic, 'icon.png'), buffer: icon512PngBuffer },
    { file: path.join(userWebPublic, 'icon-192.png'), buffer: icon192PngBuffer },
    { file: path.join(userWebPublic, 'apple-touch-icon.png'), buffer: icon192PngBuffer },
    { file: path.join(userWebPublic, 'favicon.ico'), buffer: favicon32Png },
    { file: path.join(userWebApp, 'favicon.ico'), buffer: favicon32Png },
    { file: path.join(userWebApp, 'icon.png'), buffer: icon512PngBuffer },
    { file: path.join(userWebApp, 'apple-icon.png'), buffer: icon192PngBuffer },

    // admin-web public
    { file: path.join(adminWebPublic, 'logo.png'), buffer: logoPngBuffer },
    { file: path.join(adminWebPublic, 'icon.png'), buffer: icon512PngBuffer },
    { file: path.join(adminWebPublic, 'icon-192.png'), buffer: icon192PngBuffer },
    { file: path.join(adminWebPublic, 'apple-touch-icon.png'), buffer: icon192PngBuffer },
    { file: path.join(adminWebPublic, 'favicon.ico'), buffer: favicon32Png },
    { file: path.join(adminWebApp, 'favicon.ico'), buffer: favicon32Png },
    { file: path.join(adminWebApp, 'icon.png'), buffer: icon512PngBuffer },
    { file: path.join(adminWebApp, 'apple-icon.png'), buffer: icon192PngBuffer },
  ];

  for (const item of pngOutputs) {
    fs.writeFileSync(item.file, item.buffer);
    console.log(`Saved PNG: ${item.file}`);
  }

  // Also save the user's uploaded image directly as uploaded-logo.png for exact fidelity option
  fs.copyFileSync(userUploadedPath, path.join(userWebPublic, 'user-logo.png'));
  fs.copyFileSync(userUploadedPath, path.join(adminWebPublic, 'user-logo.png'));

  console.log('All logo, icon, and favicon assets generated successfully!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
