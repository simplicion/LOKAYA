const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../apps/backend/node_modules/sharp'));

async function run() {
  console.log('--- Starting Brand Asset Generation and Media Cleanup ---');

  const rootDir = path.resolve(__dirname, '..');
  const userWebPublic = path.join(rootDir, 'apps/user-app/web/public');
  const userWebApp = path.join(rootDir, 'apps/user-app/web/src/app');
  const adminWebPublic = path.join(rootDir, 'apps/admin-web/public');
  const adminWebApp = path.join(rootDir, 'apps/admin-web/src/app');
  const androidResList = [
    path.join(rootDir, 'apps/user-app/web/android/app/src/main/res'),
    path.join(rootDir, 'apps/user-app/android/app/src/main/res'),
  ];

  const iconSvgPath = path.join(userWebPublic, 'icon.svg');
  if (!fs.existsSync(iconSvgPath)) {
    throw new Error('icon.svg does not exist at ' + iconSvgPath);
  }

  const iconSvgContent = fs.readFileSync(iconSvgPath, 'utf8');
  console.log('Read source icon.svg successfully (' + iconSvgContent.length + ' bytes)');

  // 1. Horizontal Logo SVG
  const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <g transform="translate(20, 20)">
    <!-- L -->
    <text x="5" y="66" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="72" fill="#111111" letter-spacing="-2">L</text>
    <!-- O with bold orange ring -->
    <circle cx="95" cy="42" r="30" fill="none" stroke="#FF5400" stroke-width="16" />
    <!-- KAYA -->
    <text x="145" y="66" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="72" fill="#111111" letter-spacing="-2">KAYA</text>
  </g>
</svg>`.trim();

  // 2. Favicon SVG
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

  // Write SVGs to userWebPublic
  fs.writeFileSync(path.join(userWebPublic, 'logo.svg'), logoSvg, 'utf8');
  fs.writeFileSync(path.join(userWebPublic, 'favicon.svg'), faviconSvg, 'utf8');

  // Write to adminWebPublic
  if (fs.existsSync(adminWebPublic)) {
    fs.writeFileSync(path.join(adminWebPublic, 'icon.svg'), iconSvgContent, 'utf8');
    fs.writeFileSync(path.join(adminWebPublic, 'logo.svg'), logoSvg, 'utf8');
    fs.writeFileSync(path.join(adminWebPublic, 'favicon.svg'), faviconSvg, 'utf8');
  }

  // 3. Render PNGs using sharp
  const iconBuffer = Buffer.from(iconSvgContent);

  // 512x512
  const icon512Png = await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toBuffer();

  // 192x192
  const icon192Png = await sharp(iconBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toBuffer();

  // 180x180 (Apple touch icon)
  const icon180Png = await sharp(iconBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toBuffer();

  // 32x32 & 48x48 for Favicon ICO
  const faviconBuffer = Buffer.from(faviconSvg);
  const favicon32Png = await sharp(faviconBuffer)
    .resize(32, 32)
    .png({ quality: 100 })
    .toBuffer();

  // Write web public PNGs
  fs.writeFileSync(path.join(userWebPublic, 'icon.png'), icon512Png);
  fs.writeFileSync(path.join(userWebPublic, 'icon-192.png'), icon192Png);
  fs.writeFileSync(path.join(userWebPublic, 'apple-touch-icon.png'), icon180Png);
  fs.writeFileSync(path.join(userWebPublic, 'favicon.ico'), favicon32Png);

  // Write Next.js App Router root icon files
  fs.writeFileSync(path.join(userWebApp, 'icon.png'), icon512Png);
  fs.writeFileSync(path.join(userWebApp, 'apple-icon.png'), icon180Png);
  fs.writeFileSync(path.join(userWebApp, 'favicon.ico'), favicon32Png);

  // Admin web
  if (fs.existsSync(adminWebPublic)) {
    fs.writeFileSync(path.join(adminWebPublic, 'icon.png'), icon512Png);
    fs.writeFileSync(path.join(adminWebPublic, 'icon-192.png'), icon192Png);
    fs.writeFileSync(path.join(adminWebPublic, 'apple-touch-icon.png'), icon180Png);
    fs.writeFileSync(path.join(adminWebPublic, 'favicon.ico'), favicon32Png);
  }
  if (fs.existsSync(adminWebApp)) {
    fs.writeFileSync(path.join(adminWebApp, 'icon.png'), icon512Png);
    fs.writeFileSync(path.join(adminWebApp, 'apple-icon.png'), icon180Png);
    fs.writeFileSync(path.join(adminWebApp, 'favicon.ico'), favicon32Png);
  }

  // 4. Android Launcher Icons and Splash Screens
  for (const androidRes of androidResList) {
    if (fs.existsSync(androidRes)) {
      console.log('Generating Android icons and splash screens for ' + androidRes + '...');

      // Launcher icon sizes:
      // mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192
      const densities = [
        { name: 'mipmap-mdpi', size: 48 },
        { name: 'mipmap-hdpi', size: 72 },
        { name: 'mipmap-xhdpi', size: 96 },
        { name: 'mipmap-xxhdpi', size: 144 },
        { name: 'mipmap-xxxhdpi', size: 192 },
      ];

      for (const d of densities) {
        const dir = path.join(androidRes, d.name);
        if (fs.existsSync(dir)) {
          const resized = await sharp(iconBuffer)
            .resize(d.size, d.size)
            .png({ quality: 100 })
            .toBuffer();

          fs.writeFileSync(path.join(dir, 'ic_launcher.png'), resized);
          fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), resized);
          fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), resized);
        }
      }

      // Splash screen: Center icon on clean white background
      const splashImg = await sharp({
        create: {
          width: 1080,
          height: 1920,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{
          input: await sharp(iconBuffer).resize(360, 360).toBuffer(),
          gravity: 'center'
        }])
        .png()
        .toBuffer();

      const drawableDir = path.join(androidRes, 'drawable');
      if (fs.existsSync(drawableDir)) {
        fs.writeFileSync(path.join(drawableDir, 'splash.png'), splashImg);
      }

      // Also update any port/land drawable splash screens
      const resEntries = fs.readdirSync(androidRes);
      for (const entry of resEntries) {
        if (entry.startsWith('drawable-port-') || entry.startsWith('drawable-land-')) {
          const splashFile = path.join(androidRes, entry, 'splash.png');
          if (fs.existsSync(splashFile)) {
            fs.writeFileSync(splashFile, splashImg);
          }
        }
      }
    }
  }

  // 5. Delete obsolete image and media files
  const filesToDelete = [
    path.join(userWebPublic, 'promo-ad.png'),
    path.join(userWebPublic, 'user-logo.png'),
    path.join(userWebPublic, 'user-logo-4x.png'),
    path.join(userWebPublic, 'logo.png'),
    path.join(userWebPublic, 'file.svg'),
    path.join(userWebPublic, 'globe.svg'),
    path.join(userWebPublic, 'next.svg'),
    path.join(userWebPublic, 'window.svg'),
    path.join(adminWebPublic, 'logo.png'),
    path.join(adminWebPublic, 'user-logo.png'),
  ];

  for (const f of filesToDelete) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log('Deleted obsolete file:', path.basename(f));
    }
  }

  // Delete images directory inside userWebPublic (onboarding_*.png)
  const imagesDir = path.join(userWebPublic, 'images');
  if (fs.existsSync(imagesDir)) {
    fs.rmSync(imagesDir, { recursive: true, force: true });
    console.log('Deleted obsolete images/ directory');
  }

  console.log('--- Brand Asset Generation and Media Cleanup Completed Successfully ---');
}

run().catch(err => {
  console.error('Asset Generation Error:', err);
  process.exit(1);
});
