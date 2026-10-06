import { prisma } from '@workspace/db';

const BASE_URL = process.env.CLIENT_PUBLIC_URL || 'https://lokaya.shop';
const CDN_URL = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com/lokaya-cdn';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatCdnUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${CDN_URL}/${cleanPath}`;
}

export class SeoService {
  /**
   * Generates the XML Sitemap Index referencing all sub-sitemaps
   */
  static async generateSitemapIndex(): Promise<string> {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-stores.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-profiles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  /**
   * Generates sitemap for static core pages
   */
  static generateStaticSitemap(): string {
    const today = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/explore', changefreq: 'daily', priority: '0.9' },
      { path: '/business', changefreq: 'weekly', priority: '0.8' },
      { path: '/partner', changefreq: 'weekly', priority: '0.8' },
      { path: '/support', changefreq: 'weekly', priority: '0.7' },
      { path: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
      { path: '/refund-policy', changefreq: 'monthly', priority: '0.5' },
      { path: '/community-guidelines', changefreq: 'monthly', priority: '0.5' },
      { path: '/compliance', changefreq: 'monthly', priority: '0.5' },
    ];

    const urlEntries = staticRoutes
      .map((route) => {
        return `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  /**
   * Generates dynamic sitemap for all published products
   */
  static async generateProductsSitemap(): Promise<string> {
    try {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { status: 'PUBLISHED' },
            { isActive: true }
          ]
        },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          imageUrl: true,
          media: {
            take: 1,
            select: { url: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50000 // Standard Google sitemap URL limit
      });

      const urlEntries = products
        .map((p) => {
          const lastMod = p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const rawImg = p.imageUrl || p.media?.[0]?.url;
          const imgUrl = formatCdnUrl(rawImg);

          let imageTag = '';
          if (imgUrl) {
            imageTag = `\n    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>`;
          }

          return `  <url>
    <loc>${BASE_URL}/product/${p.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${imageTag}
  </url>`;
        })
        .join('\n');

      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
    } catch (error) {
      console.error('[SeoService] Error generating products sitemap:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    }
  }

  /**
   * Generates dynamic sitemap for all active local stores
   */
  static async generateStoresSitemap(): Promise<string> {
    try {
      const stores = await prisma.store.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          logoUrl: true,
          bannerUrl: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 50000
      });

      const urlEntries = stores
        .map((s) => {
          const lastMod = s.updatedAt ? s.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const imgUrl = formatCdnUrl(s.logoUrl || s.bannerUrl);

          let imageTag = '';
          if (imgUrl) {
            imageTag = `\n    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(s.name)}</image:title>
    </image:image>`;
          }

          return `  <url>
    <loc>${BASE_URL}/store/${s.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${imageTag}
  </url>`;
        })
        .join('\n');

      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
    } catch (error) {
      console.error('[SeoService] Error generating stores sitemap:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    }
  }

  /**
   * Generates dynamic sitemap for all active public user/creator profiles
   */
  static async generateProfilesSitemap(): Promise<string> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50000
      });

      const urlEntries = users
        .map((u) => {
          const lastMod = u.createdAt ? u.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const imgUrl = formatCdnUrl(u.avatarUrl);

          let imageTag = '';
          if (imgUrl) {
            imageTag = `\n    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(u.name)}</image:title>
    </image:image>`;
          }

          return `  <url>
    <loc>${BASE_URL}/user/${u.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
        })
        .join('\n');

      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
    } catch (error) {
      console.error('[SeoService] Error generating profiles sitemap:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    }
  }
}
