const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const NAVY = '#172554';
const DARK_NAVY = '#0F172A';
const ORANGE = '#FF6B00';
const CORAL = '#FF4D6D';

const resDir = path.resolve(__dirname, '../apps/user-app/android/app/src/main/res');

function getForegroundSvg(size) {
  // Adaptive icon safe zone is the central 66%
  const scale = size / 432;
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ORANGE}" />
        <stop offset="100%" stop-color="${CORAL}" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${ORANGE}" flood-opacity="0.45" />
      </filter>
    </defs>
    <!-- Centered within adaptive safe circle (r=142 around 216,216) -->
    <g transform="translate(108, 95) scale(0.70)" filter="url(#glow)">
      <!-- L in pure white -->
      <path d="M 15 20 L 65 20 L 65 170 L 155 170 L 155 220 L 15 220 Z" fill="#FFFFFF" />
      <!-- O as vibrant brand gradient ring interlocking -->
      <circle cx="210" cy="120" r="75" fill="none" stroke="url(#brandGrad)" stroke-width="42" />
      <!-- Dot on top of L -->
      <circle cx="15" cy="15" r="7" fill="${ORANGE}" />
    </g>
    <text x="216" y="325" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" letter-spacing="5" text-anchor="middle">LOKAYA</text>
  </svg>
  `;
}

function getFullIconSvg(size) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ORANGE}" />
        <stop offset="100%" stop-color="${CORAL}" />
      </linearGradient>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1E293B" />
        <stop offset="100%" stop-color="${DARK_NAVY}" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${ORANGE}" flood-opacity="0.4" />
      </filter>
    </defs>
    <!-- Dark Navy Background -->
    <rect width="512" height="512" fill="url(#bgGrad)" />
    <circle cx="280" cy="240" r="180" fill="${ORANGE}" opacity="0.12" filter="blur(40px)" />
    
    <g transform="translate(106, 136)" filter="url(#glow)">
      <path d="M 15 20 L 65 20 L 65 170 L 155 170 L 155 220 L 15 220 Z" fill="#FFFFFF" />
      <circle cx="210" cy="120" r="75" fill="none" stroke="url(#brandGrad)" stroke-width="42" />
      <circle cx="15" cy="15" r="7" fill="${ORANGE}" />
    </g>

    <text x="256" y="445" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="#FFFFFF" letter-spacing="6" text-anchor="middle">LOKAYA</text>
  </svg>
  `;
}

function getSplashSvg(width, height) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ORANGE}" />
        <stop offset="100%" stop-color="${CORAL}" />
      </linearGradient>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#111827" />
        <stop offset="50%" stop-color="${DARK_NAVY}" />
        <stop offset="100%" stop-color="#090D16" />
      </linearGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="${ORANGE}" flood-opacity="0.45" />
      </filter>
    </defs>
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    
    <!-- Ambient Radial Glow in center -->
    <circle cx="${width / 2}" cy="${height / 2 - 20}" r="${Math.min(width, height) * 0.35}" fill="${ORANGE}" opacity="0.10" filter="blur(60px)" />
    
    <!-- Centered Brand Content -->
    <g transform="translate(${width / 2}, ${height / 2})">
      <!-- Emblem -->
      <g transform="translate(-105, -130)" filter="url(#glow)">
        <path d="M 10 15 L 55 15 L 55 135 L 125 135 L 125 175 L 10 175 Z" fill="#FFFFFF" />
        <circle cx="165" cy="95" r="60" fill="none" stroke="url(#brandGrad)" stroke-width="34" />
        <circle cx="10" cy="10" r="6" fill="${ORANGE}" />
      </g>
      
      <!-- Brand Name -->
      <text x="0" y="95" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="${Math.min(width * 0.08, 42)}" font-weight="900" fill="#FFFFFF" letter-spacing="8" text-anchor="middle">LOKAYA</text>
      
      <!-- Tagline -->
      <text x="0" y="130" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="${Math.min(width * 0.038, 18)}" font-weight="600" fill="${ORANGE}" letter-spacing="2" text-anchor="middle">See It. Know It. Buy It.</text>
    </g>
  </svg>
  `;
}

async function run() {
  console.log('--- Generating Lokaya Android Adaptive Icons & Splash Screens ---');

  // 1. Update ic_launcher_background.xml
  const bgXmlPath = path.join(resDir, 'values/ic_launcher_background.xml');
  fs.writeFileSync(bgXmlPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${DARK_NAVY}</color>\n</resources>\n`);
  console.log('✓ Updated ic_launcher_background.xml to brand navy #0F172A');

  // 2. Mipmap launcher icons (foreground + legacy full icon)
  const mipmaps = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.dir);
    if (!fs.existsSync(targetDir)) continue;

    // A) Adaptive Foreground (Transparent SVG)
    const fgSvg = getForegroundSvg(m.fgSize);
    await sharp(Buffer.from(fgSvg)).png().toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // B) Full Icon & Round Icon (for legacy launchers)
    const fullSvg = getFullIconSvg(m.iconSize);
    await sharp(Buffer.from(fullSvg)).resize(m.iconSize, m.iconSize).png().toFile(path.join(targetDir, 'ic_launcher.png'));
    await sharp(Buffer.from(fullSvg)).resize(m.iconSize, m.iconSize).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`✓ Generated icons for ${m.dir}`);
  }

  // 3. Splash Screens across all resolutions
  const splashes = [
    { dir: 'drawable', w: 480, h: 320 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const s of splashes) {
    const targetDir = path.join(resDir, s.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const splashSvg = getSplashSvg(s.w, s.h);
    await sharp(Buffer.from(splashSvg)).png().toFile(path.join(targetDir, 'splash.png'));
    console.log(`✓ Generated splash screen for ${s.dir} (${s.w}x${s.h})`);
  }

  console.log('\n✅ ALL LOKAYA ANDROID BRAND ASSETS GENERATED SUCCESSFULLY!');
}

run().catch(console.error);
