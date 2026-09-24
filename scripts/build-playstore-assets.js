const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../play-store-assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Color palette from logo.md
const NAVY = '#172554';
const DARK_NAVY = '#0F172A';
const ORANGE = '#FF6B00';
const CORAL = '#FF4D6D';
const CREAM = '#FAF9F6';
const SURFACE = '#FFFFFF';
const MUTED = '#64748B';
const BORDER = '#E7E5E0';

async function generateAppIcon() {
  console.log('Generating 512x512 App Icon...');
  // 512x512 with safe padding (~20% margin for Google Play squircle mask)
  const iconSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${ORANGE}" flood-opacity="0.35" />
      </filter>
    </defs>
    <!-- Background -->
    <rect width="512" height="512" fill="url(#bgGrad)" />
    
    <!-- Subtle Ambient Radial Glow -->
    <circle cx="280" cy="240" r="180" fill="${ORANGE}" opacity="0.12" filter="blur(40px)" />
    
    <!-- Centered Emblem -->
    <g transform="translate(106, 136)" filter="url(#glow)">
      <!-- L in pure white -->
      <path d="M 15 20 L 65 20 L 65 170 L 155 170 L 155 220 L 15 220 Z" fill="#FFFFFF" />
      
      <!-- O as vibrant brand gradient ring interlocking -->
      <circle cx="210" cy="120" r="75" fill="none" stroke="url(#brandGrad)" stroke-width="42" />
      
      <!-- Accent Dots on brand aesthetic -->
      <circle cx="15" cy="15" r="7" fill="${ORANGE}" />
    </g>

    <!-- Subtle Brand Wordmark at bottom -->
    <text x="256" y="445" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" letter-spacing="6" text-anchor="middle">LOKAYA</text>
  </svg>
  `;

  const iconBuffer = Buffer.from(iconSvg);
  const outPath = path.join(OUTPUT_DIR, 'playstore_icon_512x512.png');
  await sharp(iconBuffer).png().toFile(outPath);
  console.log('Saved:', outPath);

  // Also update android launcher icons
  const resDir = path.resolve(__dirname, '../apps/user-app/android/app/src/main/res');
  const densities = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const d of densities) {
    const targetDir = path.join(resDir, d.dir);
    if (fs.existsSync(targetDir)) {
      await sharp(iconBuffer).resize(d.size, d.size).png().toFile(path.join(targetDir, 'ic_launcher.png'));
      await sharp(iconBuffer).resize(d.size, d.size).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
    }
  }
  console.log('Updated Android launcher icons across all mipmap densities.');
}

async function generateFeatureGraphic() {
  console.log('Generating 1024x500 Feature Graphic...');
  const src = 'C:/Users/saavi/.gemini/antigravity-ide/brain/a0fd4767-ff96-495f-8a0a-5b5430172ce3/lokaya_feature_graphic_1790266580075.jpg';
  const outPath = path.join(OUTPUT_DIR, 'feature_graphic_1024x500.png');

  if (fs.existsSync(src)) {
    await sharp(src)
      .resize(1024, 500, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 95 })
      .toFile(outPath);
    console.log('Saved Feature Graphic (from AI render):', outPath);
  } else {
    // Fallback SVG rendering
    const fgSvg = `
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${NAVY}" />
          <stop offset="100%" stop-color="${DARK_NAVY}" />
        </linearGradient>
        <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${ORANGE}" />
          <stop offset="100%" stop-color="${CORAL}" />
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#bg)" />
      <circle cx="750" cy="250" r="220" fill="${ORANGE}" opacity="0.15" filter="blur(60px)" />
      <g transform="translate(80, 160)">
        <text x="0" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="76" fill="#FFFFFF" letter-spacing="-1">LOKAYA</text>
        <text x="0" y="55" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="34" fill="${ORANGE}">See It. Know It. Buy It.</text>
        <text x="0" y="110" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="20" fill="#94A3B8">Discover Local Stores • Creator Reels • Instant Delivery</text>
      </g>
    </svg>
    `;
    await sharp(Buffer.from(fgSvg)).png().toFile(outPath);
  }
}

// Create High-Fidelity Phone Showcase Screenshots (1080 x 1920)
async function generatePhoneScreenshots() {
  console.log('Generating Phone Screenshots (1080x1920)...');

  const screens = [
    {
      id: 'phone_01_social_discovery',
      badge: 'HYPERLOCAL COMMERCE',
      headline: 'See It. Know It. Buy It.',
      subtitle: 'Discover trending outfits and local stores in your neighbourhood.',
      primaryColor: ORANGE,
      cards: [
        { title: 'The Artisan Studio', sub: 'Indiranagar • 1.2 km away', tag: 'Open Now', price: '₹1,499' },
        { title: 'Organic Harvest Market', sub: '100ft Road • 800m away', tag: 'Instant Pickup', price: '₹349' },
        { title: 'Urban Threads Collective', sub: 'Koramangala • 2.5 km away', tag: 'Trending', price: '₹2,199' }
      ]
    },
    {
      id: 'phone_02_stores_nearby',
      badge: 'STORES WITHIN 5-10 KM',
      headline: 'Know Your Neighborhood',
      subtitle: 'Browse authentic physical storefronts with real-time stock and ratings.',
      primaryColor: NAVY,
      cards: [
        { title: 'Craft Coffee &amp; Roastery', sub: '4.9 ★ (340+ reviews)', tag: 'Verified Merchant', price: '₹250+' },
        { title: 'Boutique Silk &amp; Handlooms', sub: '4.8 ★ (120+ reviews)', tag: 'Local Legend', price: '₹3,500' },
        { title: 'Modern Pottery Studio', sub: '4.9 ★ (88 reviews)', tag: 'Same-day Dispatch', price: '₹899' }
      ]
    },
    {
      id: 'phone_03_creator_reels',
      badge: 'WATCH &amp; SHOP',
      headline: 'Creator Reels with Instant Buy',
      subtitle: 'Tap on any tagged product inside videos to purchase in seconds.',
      primaryColor: CORAL,
      cards: [
        { title: 'Linen Summer Co-ord Set', sub: 'Tagged in @priya_style reel', tag: 'Selling Fast', price: '₹1,899' },
        { title: 'Handcrafted Brass Filter Coffee Set', sub: 'Tagged in @bengaluru_eats', tag: 'Free Delivery', price: '₹750' },
        { title: 'Oversized Minimalist Jacket', sub: 'Tagged in @raghav_fits', tag: 'Only 3 Left', price: '₹2,499' }
      ]
    },
    {
      id: 'phone_04_express_delivery',
      badge: 'LIGHTNING FAST',
      headline: 'Same-Day Local Dispatch',
      subtitle: 'Direct from neighborhood shelves straight to your doorstep.',
      primaryColor: ORANGE,
      cards: [
        { title: 'Live Courier Route', sub: 'Rider reaching your address in 24 min', tag: 'GPS Active', price: 'Order #89201' },
        { title: 'Packaging Verified', sub: 'Inspected by store merchant', tag: 'Eco Sealed', price: 'Standard OTP' },
        { title: 'Delivery Partner Masking', sub: 'End-to-end privacy for phone and address', tag: '100% Secure', price: 'Contactless' }
      ]
    },
    {
      id: 'phone_05_secure_checkout',
      badge: 'PCI-DSS &amp; RBI COMPLIANT',
      headline: 'Seamless &amp; Safe Checkout',
      subtitle: 'One-tap UPI, cards, Netbanking and Cash on Delivery.',
      primaryColor: NAVY,
      cards: [
        { title: 'Google Pay / PhonePe / Paytm UPI', sub: 'Zero gateway surcharge', tag: 'Recommended', price: 'Instant' },
        { title: 'Razorpay Certified Gateway', sub: '256-bit TLS bank encryption', tag: 'PCI-DSS', price: 'Safe' },
        { title: 'Easy 7-Day Returns', sub: 'Hassle-free refunds policy', tag: 'Guaranteed', price: 'Buyer Protection' }
      ]
    }
  ];

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const svg = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad_${i}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FAF9F6" />
          <stop offset="100%" stop-color="#F1EFEA" />
        </linearGradient>
        <linearGradient id="phoneCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#FAF9F6" />
        </linearGradient>
        <filter id="phoneShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="28" stdDeviation="36" flood-color="#0F172A" flood-opacity="0.18" />
        </filter>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.06" />
        </filter>
      </defs>

      <!-- Canvas Background -->
      <rect width="1080" height="1920" fill="url(#bgGrad_${i})" />

      <!-- Decorative ambient glow -->
      <circle cx="920" cy="180" r="320" fill="${ORANGE}" opacity="0.08" filter="blur(90px)" />
      <circle cx="160" cy="1600" r="280" fill="${CORAL}" opacity="0.06" filter="blur(80px)" />

      <!-- Top Marketing Header -->
      <g transform="translate(100, 140)">
        <!-- Badge -->
        <rect x="0" y="0" width="280" height="46" rx="23" fill="${s.primaryColor}" opacity="0.1" />
        <text x="140" y="29" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="18" fill="${s.primaryColor}" text-anchor="middle" letter-spacing="2">${s.badge}</text>

        <!-- Main Headline -->
        <text x="0" y="125" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="58" fill="${NAVY}" letter-spacing="-1.5">${s.headline}</text>
        
        <!-- Subtitle -->
        <text x="0" y="185" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="500" font-size="28" fill="${MUTED}" max-width="880">${s.subtitle}</text>
      </g>

      <!-- Smartphone Mockup Container -->
      <g transform="translate(140, 430)" filter="url(#phoneShadow)">
        <!-- Phone Outer Frame -->
        <rect x="0" y="0" width="800" height="1550" rx="64" fill="#0F172A" stroke="#334155" stroke-width="8" />

        <!-- Phone Inner Bezel & Display Screen -->
        <rect x="18" y="18" width="764" height="1514" rx="52" fill="#FAF9F6" />

        <!-- Dynamic Island / Speaker Notch -->
        <rect x="300" y="32" width="200" height="38" rx="19" fill="#000000" />
        <circle cx="460" cy="51" r="5" fill="#1E293B" />

        <!-- In-App Header -->
        <g transform="translate(56, 105)">
          <text x="0" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="34" fill="${NAVY}" letter-spacing="3">LOKAYA</text>
          <circle cx="56" cy="18" r="14" fill="none" stroke="${ORANGE}" stroke-width="6" />
          <!-- Search Bar in App -->
          <rect x="0" y="65" width="652" height="60" rx="18" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1.5" />
          <text x="40" y="103" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" fill="#94A3B8">Search neighborhood stores, reels, items...</text>
        </g>

        <!-- Simulated In-App Cards -->
        <g transform="translate(56, 275)">
          ${s.cards.map((c, idx) => `
            <g transform="translate(0, ${idx * 270})" filter="url(#cardShadow)">
              <!-- Card Surface -->
              <rect width="652" height="235" rx="28" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1.5" />
              
              <!-- Left Color Indicator Accent -->
              <rect x="0" y="24" width="8" height="70" rx="4" fill="${s.primaryColor}" />

              <!-- Card Content -->
              <text x="36" y="58" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="${NAVY}">${c.title}</text>
              <text x="36" y="98" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="20" fill="${MUTED}">${c.sub}</text>

              <!-- Tag Pill -->
              <rect x="36" y="132" width="160" height="38" rx="19" fill="#F5F3EF" stroke="${BORDER}" />
              <text x="116" y="157" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="15" fill="${NAVY}" text-anchor="middle">${c.tag}</text>

              <!-- Price & CTA -->
              <text x="616" y="70" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="32" fill="${NAVY}" text-anchor="end">${c.price}</text>
              <rect x="496" y="125" width="120" height="46" rx="23" fill="${ORANGE}" />
              <text x="556" y="154" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="17" fill="#FFFFFF" text-anchor="middle">BUY</text>
            </g>
          `).join('')}
        </g>

        <!-- Bottom Navigation Bar inside Phone -->
        <g transform="translate(18, 1400)">
          <rect width="764" height="114" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1" />
          <!-- Icons -->
          <circle cx="120" cy="50" r="8" fill="${ORANGE}" />
          <text x="120" y="78" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="${ORANGE}" text-anchor="middle">Home</text>
          
          <circle cx="280" cy="50" r="8" fill="#94A3B8" />
          <text x="280" y="78" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="14" fill="#94A3B8" text-anchor="middle">Reels</text>

          <circle cx="440" cy="50" r="8" fill="#94A3B8" />
          <text x="440" y="78" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="14" fill="#94A3B8" text-anchor="middle">Stores</text>

          <circle cx="600" cy="50" r="8" fill="#94A3B8" />
          <text x="600" y="78" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="14" fill="#94A3B8" text-anchor="middle">Orders</text>
        </g>
      </g>
    </svg>
    `;

    const out = path.join(OUTPUT_DIR, `${s.id}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`Saved screenshot ${i + 1}/5:`, out);
  }
}

// Generate 7-Inch Tablet Screenshots (1200 x 1920)
async function generateTablet7Screenshots() {
  console.log('Generating 7-inch Tablet Screenshots (1200x1920)...');
  const screens = [
    {
      id: 'tablet_7in_01_catalog',
      title: 'Optimized for Tablet &amp; Large Displays',
      sub: 'Multi-column grid for immersive catalog discovery and store exploration.'
    },
    {
      id: 'tablet_7in_02_map_discovery',
      title: 'Hyperlocal Map &amp; Store Locator',
      sub: 'Explore stores, directions, operating hours, and live inventory side-by-side.'
    }
  ];

  for (const s of screens) {
    const svg = `
    <svg width="1200" height="1920" viewBox="0 0 1200 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tabBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FAF9F6" />
          <stop offset="100%" stop-color="#EFECE6" />
        </linearGradient>
        <filter id="tabShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#0F172A" flood-opacity="0.14" />
        </filter>
      </defs>
      <rect width="1200" height="1920" fill="url(#tabBg)" />
      
      <g transform="translate(100, 120)">
        <text x="0" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="54" fill="${NAVY}">${s.title}</text>
        <text x="0" y="115" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="26" fill="${MUTED}">${s.sub}</text>
      </g>

      <!-- Tablet Frame -->
      <g transform="translate(100, 310)" filter="url(#tabShadow)">
        <rect width="1000" height="1480" rx="44" fill="#0F172A" stroke="#334155" stroke-width="8" />
        <rect x="16" y="16" width="968" height="1448" rx="34" fill="#FFFFFF" />

        <!-- Split Grid Showcase inside Tablet -->
        <g transform="translate(48, 60)">
          <!-- Top Tablet Bar -->
          <text x="0" y="40" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="36" fill="${NAVY}">LOKAYA TABLET</text>
          <rect x="620" y="8" width="250" height="50" rx="25" fill="${ORANGE}" />
          <text x="745" y="40" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="18" fill="#FFFFFF" text-anchor="middle">EXPRESS 5-10KM</text>

          <!-- 2 Column Tablet Grid -->
          <g transform="translate(0, 100)">
            <!-- Left Col -->
            <rect x="0" y="0" width="410" height="580" rx="24" fill="#FAF9F6" stroke="${BORDER}" stroke-width="2" />
            <rect x="30" y="30" width="350" height="340" rx="18" fill="#E2E8F0" />
            <text x="30" y="420" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="26" fill="${NAVY}">Artisanal Handlooms</text>
            <text x="30" y="460" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" fill="${MUTED}">Indiranagar Boutique</text>
            <text x="30" y="520" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="28" fill="${ORANGE}">₹2,299</text>

            <!-- Right Col -->
            <rect x="460" y="0" width="410" height="580" rx="24" fill="#FAF9F6" stroke="${BORDER}" stroke-width="2" />
            <rect x="490" y="30" width="350" height="340" rx="18" fill="#E2E8F0" />
            <text x="490" y="420" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="26" fill="${NAVY}">Fresh Farm Harvest</text>
            <text x="490" y="460" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" fill="${MUTED}">Organic Daily Dispatch</text>
            <text x="490" y="520" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="28" fill="${ORANGE}">₹450</text>
          </g>

          <g transform="translate(0, 720)">
            <rect x="0" y="0" width="870" height="560" rx="24" fill="#FAF9F6" stroke="${BORDER}" stroke-width="2" />
            <text x="40" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="${NAVY}">Neighborhood Creator Showcase</text>
            <text x="40" y="100" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" fill="${MUTED}">Watch high-definition reels from local trendsetters</text>
            
            <circle cx="120" cy="240" r="60" fill="${ORANGE}" opacity="0.15" />
            <circle cx="280" cy="240" r="60" fill="${CORAL}" opacity="0.15" />
            <circle cx="440" cy="240" r="60" fill="${NAVY}" opacity="0.15" />
          </g>
        </g>
      </g>
    </svg>
    `;
    const out = path.join(OUTPUT_DIR, `${s.id}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log('Saved Tablet 7" screenshot:', out);
  }
}

// Generate 10-Inch Tablet Screenshots (1920 x 1200 Landscape)
async function generateTablet10Screenshots() {
  console.log('Generating 10-inch Tablet Screenshots (1920x1200 Landscape)...');
  const screens = [
    {
      id: 'tablet_10in_01_editorial',
      title: 'Full Tablet Experience for Shoppers &amp; Merchants',
      sub: 'Manage orders, discover live community drops, and navigate local retail with clarity.'
    },
    {
      id: 'tablet_10in_02_merchant_hub',
      title: 'Built for Neighborhood Stores &amp; Creators',
      sub: 'Real-time sales analytics, instant catalog publishing, and localized delivery dispatch.'
    }
  ];

  for (const s of screens) {
    const svg = `
    <svg width="1920" height="1200" viewBox="0 0 1920 1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg10" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FAF9F6" />
          <stop offset="100%" stop-color="#ECE8DF" />
        </linearGradient>
        <filter id="sh10" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#0F172A" flood-opacity="0.16" />
        </filter>
      </defs>
      <rect width="1920" height="1200" fill="url(#bg10)" />

      <!-- Top Headline -->
      <g transform="translate(140, 90)">
        <text x="0" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="52" fill="${NAVY}">${s.title}</text>
        <text x="0" y="100" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="24" fill="${MUTED}">${s.sub}</text>
      </g>

      <!-- 10" Tablet Mockup Frame -->
      <g transform="translate(140, 240)" filter="url(#sh10)">
        <rect width="1640" height="880" rx="36" fill="#0F172A" stroke="#334155" stroke-width="8" />
        <rect x="16" y="16" width="1608" height="848" rx="26" fill="#FFFFFF" />

        <!-- 3 Column Wide Layout -->
        <g transform="translate(50, 50)">
          <!-- App Header -->
          <text x="0" y="40" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="34" fill="${NAVY}">LOKAYA SOCIAL COMMERCE</text>
          <text x="0" y="75" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="18" fill="${ORANGE}">See It. Know It. Buy It.</text>

          <g transform="translate(0, 110)">
            <!-- Column 1: Store Feed -->
            <rect x="0" y="0" width="470" height="640" rx="20" fill="#FAF9F6" stroke="${BORDER}" />
            <text x="30" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="${NAVY}">Nearby Stores</text>
            <rect x="30" y="80" width="410" height="150" rx="16" fill="#FFFFFF" stroke="${BORDER}" />
            <rect x="30" y="250" width="410" height="150" rx="16" fill="#FFFFFF" stroke="${BORDER}" />
            <rect x="30" y="420" width="410" height="150" rx="16" fill="#FFFFFF" stroke="${BORDER}" />

            <!-- Column 2: Live Reels -->
            <rect x="510" y="0" width="470" height="640" rx="20" fill="#FAF9F6" stroke="${BORDER}" />
            <text x="540" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="${NAVY}">Live Creator Drops</text>
            <rect x="540" y="80" width="410" height="490" rx="16" fill="#0F172A" />
            <text x="745" y="320" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="#FFFFFF" text-anchor="middle">4K Creator Reel</text>
            <rect x="675" y="470" width="140" height="46" rx="23" fill="${ORANGE}" />
            <text x="745" y="500" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="18" fill="#FFFFFF" text-anchor="middle">BUY NOW</text>

            <!-- Column 3: Cart & Rapid Delivery -->
            <rect x="1020" y="0" width="470" height="640" rx="20" fill="#FAF9F6" stroke="${BORDER}" />
            <text x="1050" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="${NAVY}">Fast Local Dispatch</text>
            <rect x="1050" y="80" width="410" height="280" rx="16" fill="#FFFFFF" stroke="${BORDER}" />
            <text x="1080" y="140" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="22" fill="${NAVY}">Estimated Delivery</text>
            <text x="1080" y="180" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="38" fill="${ORANGE}">28 Mins</text>
            <text x="1080" y="220" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" fill="${MUTED}">From 100ft Road Store</text>

            <rect x="1050" y="520" width="410" height="60" rx="30" fill="${NAVY}" />
            <text x="1255" y="558" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="20" fill="#FFFFFF" text-anchor="middle">PLACE ORDER</text>
          </g>
        </g>
      </g>
    </svg>
    `;
    const out = path.join(OUTPUT_DIR, `${s.id}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log('Saved Tablet 10" screenshot:', out);
  }
}

async function run() {
  await generateAppIcon();
  await generateFeatureGraphic();
  await generatePhoneScreenshots();
  await generateTablet7Screenshots();
  await generateTablet10Screenshots();
  console.log('--- ALL PLAY STORE ASSETS GENERATED SUCCESSFULLY ---');
}

run().catch(console.error);
