/**
 * Cloudflare Pages Advanced Edge Router & SEO Engine for Lokaya
 *
 * Provides:
 * 1. Edge SSR & Dynamic Metadata Injection for Search Engine Crawlers (Googlebot, Bingbot, etc.)
 * 2. Real-time dynamic XML Sitemaps (/sitemap.xml, /sitemap-products.xml, /sitemap-stores.xml, etc.)
 * 3. OpenGraph & Twitter Social Card pre-rendering (WhatsApp, Facebook, Twitter, iMessage)
 * 4. JSON-LD Structured Data Injection (schema.org/Product, Store, ProfilePage, BreadcrumbList)
 * 5. Accurate HTTP 404 status codes for non-existent entities (preventing soft 404s)
 * 6. Clean-URL routing and Next.js RSC flight stream handling
 */

const BASE_URL = 'https://lokaya.shop';
const BACKEND_URL = 'https://api.lokaya.shop';
const CDN_URL = 'https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com/lokaya-cdn';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveMediaUrl(url) {
  if (!url) return 'https://lokaya.shop/promo-ad.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${CDN_URL}/${cleanPath}`;
}

const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'baiduspider',
  'applebot',
  'facebot',
  'facebookexternalhit',
  'twitterbot',
  'whatsapp',
  'linkedinbot',
  'slackbot',
  'telegrambot',
  'discordbot',
  'pinterest',
  'skypeuripreview'
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => lower.includes(bot));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get('user-agent') || '';
    const backendBase = env?.NEXT_PUBLIC_BACKEND_URL || BACKEND_URL;

    // 1. Static Assets Pass-Through (JS chunks, CSS, images, icons, fonts, media, manifests)
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/images/') ||
      pathname.startsWith('/downloads/') ||
      /\.(ico|png|jpg|jpeg|svg|webp|gif|mp4|webm|woff|woff2|ttf|eot|css|js|txt|map|webmanifest)$/i.test(pathname)
    ) {
      return env.ASSETS.fetch(request);
    }

    // 2. Robots.txt
    if (pathname === '/robots.txt') {
      const robotsRes = await env.ASSETS.fetch(request);
      if (robotsRes.status === 200) {
        const headers = new Headers(robotsRes.headers);
        headers.set('Content-Type', 'text/plain; charset=utf-8');
        headers.set('Cache-Control', 'public, max-age=86400');
        return new Response(robotsRes.body, { status: 200, headers });
      }
    }

    // 3. XML Sitemaps (Proxy live dynamically from backend API with fallback to static)
    if (pathname === '/sitemap.xml' || (pathname.startsWith('/sitemap-') && pathname.endsWith('.xml'))) {
      const sitemapEndpoint = pathname.replace(/^\//, '');
      try {
        const liveSitemapRes = await fetch(`${backendBase}/api/v1/meta/${sitemapEndpoint}`, {
          headers: { 'Accept': 'application/xml' },
          cf: { cacheTtl: 1800, cacheEverything: true }
        });
        if (liveSitemapRes.status === 200) {
          const newHeaders = new Headers(liveSitemapRes.headers);
          newHeaders.set('Content-Type', 'application/xml; charset=utf-8');
          newHeaders.set('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400');
          return new Response(liveSitemapRes.body, { status: 200, headers: newHeaders });
        }
      } catch (e) {
        // Fallback to static asset in /out
      }

      const staticSitemapRes = await env.ASSETS.fetch(request);
      if (staticSitemapRes.status === 200) {
        const headers = new Headers(staticSitemapRes.headers);
        headers.set('Content-Type', 'application/xml; charset=utf-8');
        return new Response(staticSitemapRes.body, { status: 200, headers });
      }
    }

    // 4. Normalize path and detect React Server Component (RSC) requests
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const isRSC = url.searchParams.has('_rsc') || request.headers.get('rsc') === '1' || request.headers.get('accept')?.includes('text/x-component');

    // 5. For RSC requests on static routes, serve the corresponding .txt payload
    if (isRSC) {
      const rscCandidatePath = normalizedPath === '/' ? '/index.txt' : `${normalizedPath}.txt`;
      const rscCandidateUrl = new URL(rscCandidatePath, url.origin);
      const rscCandidateRes = await env.ASSETS.fetch(new Request(rscCandidateUrl.toString(), {
        method: 'GET',
        headers: {
          ...Object.fromEntries(request.headers),
          'Accept': 'text/x-component'
        }
      }));

      if (rscCandidateRes.status >= 200 && rscCandidateRes.status < 300) {
        const newHeaders = new Headers(rscCandidateRes.headers);
        newHeaders.set('Content-Type', 'text/x-component');
        newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
        return new Response(rscCandidateRes.body, {
          status: 200,
          statusText: 'OK',
          headers: newHeaders
        });
      }
    }

    // 6. Direct exact static route match (e.g. /home, /explore, /business, /partner, /privacy-policy)
    const exactAssetResponse = await env.ASSETS.fetch(request);
    if (exactAssetResponse.status === 200) {
      return exactAssetResponse;
    }

    if (!pathname.endsWith('.html') && !pathname.includes('.')) {
      const htmlUrl = new URL(`${normalizedPath}.html`, url.origin);
      const htmlRes = await env.ASSETS.fetch(new Request(htmlUrl.toString(), request));
      if (htmlRes.status === 200) {
        const newHeaders = new Headers(htmlRes.headers);
        newHeaders.set('Content-Type', 'text/html; charset=utf-8');
        newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
        return new Response(htmlRes.body, {
          status: 200,
          statusText: 'OK',
          headers: newHeaders
        });
      }
    }

    // 7. Dynamic Route Resolution with Edge Metadata & HTMLRewriter
    const resolveDynamicRouteWithSeo = async (cleanPath, rscPath, metadataFetcher) => {
      // If it's an RSC stream request, pass through RSC
      if (isRSC && rscPath) {
        const rscUrl = new URL(rscPath, url.origin);
        const rscRes = await env.ASSETS.fetch(new Request(rscUrl.toString(), {
          method: 'GET',
          headers: {
            ...Object.fromEntries(request.headers),
            'Accept': 'text/x-component'
          }
        }));

        if (rscRes.status >= 200 && rscRes.status < 300) {
          const newHeaders = new Headers(rscRes.headers);
          newHeaders.set('Content-Type', 'text/x-component');
          newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
          return new Response(rscRes.body, {
            status: 200,
            statusText: 'OK',
            headers: newHeaders
          });
        }
      }

      // Fetch base template HTML from static export
      const pageUrl = new URL(cleanPath, url.origin);
      let pageRes = await env.ASSETS.fetch(new Request(pageUrl.toString(), {
        method: 'GET',
        headers: Object.fromEntries(request.headers)
      }));

      if (pageRes.status >= 300 && pageRes.status < 400 && pageRes.headers.has('location')) {
        const redirectLocation = pageRes.headers.get('location');
        pageRes = await env.ASSETS.fetch(new Request(new URL(redirectLocation, url.origin).toString(), {
          method: 'GET',
          headers: Object.fromEntries(request.headers)
        }));
      }

      if (pageRes.status < 200 || pageRes.status >= 300) {
        return exactAssetResponse;
      }

      // Fetch dynamic SEO payload
      let seoData = null;
      if (metadataFetcher) {
        try {
          seoData = await metadataFetcher();
        } catch (e) {
          seoData = null;
        }
      }

      // If entity was checked and confirmed not found, return true HTTP 404
      if (seoData && seoData.notFound) {
        const notFoundRes = await env.ASSETS.fetch(new Request(new URL('/404', url.origin).toString(), request));
        if (notFoundRes.status === 200) {
          const headers = new Headers(notFoundRes.headers);
          headers.set('Content-Type', 'text/html; charset=utf-8');
          headers.set('Cache-Control', 'no-store, must-revalidate');
          return new Response(notFoundRes.body, { status: 404, headers });
        }
      }

      // If no custom SEO metadata retrieved, return standard base template
      if (!seoData || !seoData.title) {
        const newHeaders = new Headers(pageRes.headers);
        newHeaders.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(pageRes.body, { status: 200, headers: newHeaders });
      }

      // Inject SEO metadata and JSON-LD via HTMLRewriter
      const rewriter = new HTMLRewriter()
        .on('title', {
          element(el) {
            el.setInnerContent(escapeHtml(seoData.title));
          }
        })
        .on('head', {
          element(el) {
            // Canonical URL
            if (seoData.canonical) {
              el.append(`<link rel="canonical" href="${escapeHtml(seoData.canonical)}">`, { html: true });
            }
            // Meta Description
            if (seoData.description) {
              el.append(`<meta name="description" content="${escapeHtml(seoData.description)}">`, { html: true });
            }
            // Open Graph
            if (seoData.og) {
              if (seoData.og.title) el.append(`<meta property="og:title" content="${escapeHtml(seoData.og.title)}">`, { html: true });
              if (seoData.og.description) el.append(`<meta property="og:description" content="${escapeHtml(seoData.og.description)}">`, { html: true });
              if (seoData.og.image) el.append(`<meta property="og:image" content="${escapeHtml(seoData.og.image)}">`, { html: true });
              if (seoData.og.url) el.append(`<meta property="og:url" content="${escapeHtml(seoData.og.url)}">`, { html: true });
              if (seoData.og.type) el.append(`<meta property="og:type" content="${escapeHtml(seoData.og.type)}">`, { html: true });
              el.append(`<meta property="og:site_name" content="Lokaya">`, { html: true });
              if (seoData.og.price) {
                el.append(`<meta property="product:price:amount" content="${escapeHtml(seoData.og.price)}">`, { html: true });
                el.append(`<meta property="product:price:currency" content="INR">`, { html: true });
              }
            }
            // Twitter
            el.append(`<meta name="twitter:card" content="summary_large_image">`, { html: true });
            el.append(`<meta name="twitter:site" content="@LokayaShop">`, { html: true });
            if (seoData.title) el.append(`<meta name="twitter:title" content="${escapeHtml(seoData.title)}">`, { html: true });
            if (seoData.description) el.append(`<meta name="twitter:description" content="${escapeHtml(seoData.description)}">`, { html: true });
            if (seoData.og?.image) el.append(`<meta name="twitter:image" content="${escapeHtml(seoData.og.image)}">`, { html: true });

            // JSON-LD Structured Data
            if (seoData.jsonLd) {
              el.append(`<script type="application/ld+json">${JSON.stringify(seoData.jsonLd)}</script>`, { html: true });
            }
          }
        });

      // For search crawlers, inject pre-rendered semantic HTML inside <body> so Googlebot reads it instantly
      if (seoData.crawlerHtml && isCrawler(userAgent)) {
        rewriter.on('body', {
          element(el) {
            el.prepend(`<div id="lokaya-crawler-prerender" class="sr-only" style="position:relative;padding:16px;">${seoData.crawlerHtml}</div>`, { html: true });
          }
        });
      }

      const transformedResponse = rewriter.transform(pageRes);
      const finalHeaders = new Headers(transformedResponse.headers);
      finalHeaders.set('Content-Type', 'text/html; charset=utf-8');
      finalHeaders.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      return new Response(transformedResponse.body, {
        status: 200,
        headers: finalHeaders
      });
    };

    // --- Dynamic Route Matchers with Live SEO Data Fetching ---

    // 1. Product Detail Page: /product/[id]
    if (normalizedPath.startsWith('/product/')) {
      const parts = normalizedPath.split('/product/')[1]?.split('/');
      const productId = parts?.[0];

      return resolveDynamicRouteWithSeo('/product/1', '/product/1.txt', async () => {
        if (!productId || productId === '1') return null;

        const res = await fetch(`${backendBase}/api/v1/catalog/products/${productId}`, {
          cf: { cacheTtl: 120, cacheEverything: true }
        });

        if (res.status === 404) {
          return { notFound: true };
        }
        if (!res.ok) return null;

        const product = await res.json();
        if (!product || !product.id) return { notFound: true };

        const price = product.sellingPrice || product.price || 0;
        const imgUrl = resolveMediaUrl(product.imageUrl || product.media?.[0]?.url);
        const storeName = product.store?.name || 'Local Merchant';
        const title = `${product.name} - Buy Online at ₹${price} | Lokaya`;
        const description = product.description
          ? `${product.name}: ${product.description.slice(0, 150)}... Buy now on Lokaya with fast delivery.`
          : `Buy ${product.name} online at ₹${price} from ${storeName} on Lokaya. Authentic products & fast local delivery.`;

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: [imgUrl],
          description: product.description || `Buy ${product.name} on Lokaya.`,
          sku: product.sku || product.id,
          offers: {
            '@type': 'Offer',
            url: `https://lokaya.shop/product/${product.id}`,
            priceCurrency: 'INR',
            price: price,
            availability: product.stockCount > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: storeName
            }
          }
        };

        const crawlerHtml = `
          <nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/explore">Explore</a> &gt; <span>${escapeHtml(product.name)}</span></nav>
          <h1>${escapeHtml(product.name)}</h1>
          <p>Price: ₹${price}</p>
          <p>Sold by: <a href="/store/${product.storeId}">${escapeHtml(storeName)}</a></p>
          <p>${escapeHtml(product.description || '')}</p>
        `;

        return {
          title,
          description,
          canonical: `https://lokaya.shop/product/${product.id}`,
          og: {
            title,
            description,
            image: imgUrl,
            url: `https://lokaya.shop/product/${product.id}`,
            type: 'product',
            price: String(price)
          },
          jsonLd,
          crawlerHtml
        };
      });
    }

    // 2. Store Pages: /store/[id]
    if (normalizedPath.startsWith('/store/')) {
      const parts = normalizedPath.split('/store/')[1]?.split('/');
      const storeId = parts?.[0];

      return resolveDynamicRouteWithSeo('/store/1', '/store/1.txt', async () => {
        if (!storeId || storeId === '1') return null;

        const res = await fetch(`${backendBase}/api/v1/seller/store/${storeId}`, {
          cf: { cacheTtl: 300, cacheEverything: true }
        });

        if (res.status === 404) {
          return { notFound: true };
        }
        if (!res.ok) return null;

        const storeData = await res.json();
        const store = storeData.store || storeData;
        if (!store || !store.id) return { notFound: true };

        const locationLabel = store.city || store.address || 'Local Merchant';
        const title = `${store.name} - Verified Store in ${locationLabel} | Lokaya`;
        const description = store.description
          ? `${store.name}: ${store.description.slice(0, 150)}... Shop on Lokaya.`
          : `Shop directly from ${store.name} in ${locationLabel} on Lokaya. Browse products, order online with fast delivery.`;
        const imgUrl = resolveMediaUrl(store.logoUrl || store.bannerUrl);

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: store.name,
          url: `https://lokaya.shop/store/${store.id}`,
          image: [imgUrl],
          description: store.description || '',
          address: {
            '@type': 'PostalAddress',
            streetAddress: store.address || '',
            addressLocality: store.city || '',
            addressRegion: store.state || '',
            addressCountry: 'IN'
          }
        };

        const crawlerHtml = `
          <nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/explore">Stores</a> &gt; <span>${escapeHtml(store.name)}</span></nav>
          <h1>${escapeHtml(store.name)}</h1>
          <p>Address: ${escapeHtml(store.address || '')}, ${escapeHtml(store.city || '')}</p>
          <p>${escapeHtml(store.description || '')}</p>
        `;

        return {
          title,
          description,
          canonical: `https://lokaya.shop/store/${store.id}`,
          og: {
            title,
            description,
            image: imgUrl,
            url: `https://lokaya.shop/store/${store.id}`,
            type: 'website'
          },
          jsonLd,
          crawlerHtml
        };
      });
    }

    // 3. User Public Profile Page: /user/[id]
    if (normalizedPath.startsWith('/user/')) {
      const parts = normalizedPath.split('/user/')[1]?.split('/');
      const userId = parts?.[0];

      return resolveDynamicRouteWithSeo('/user/1', '/user/1.txt', async () => {
        if (!userId || userId === '1') return null;

        const res = await fetch(`${backendBase}/api/v1/identity/users/${userId}/public`, {
          cf: { cacheTtl: 300, cacheEverything: true }
        });

        if (res.status === 404) {
          return { notFound: true };
        }
        if (!res.ok) return null;

        const user = await res.json();
        if (!user || !user.id) return { notFound: true };

        const title = `${user.name} on Lokaya | Social Commerce Profile`;
        const description = `Follow ${user.name} on Lokaya. Discover trending creator reels, product recommendations, and local shopping collections.`;
        const imgUrl = resolveMediaUrl(user.avatarUrl);

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: user.name,
            identifier: user.id,
            url: `https://lokaya.shop/user/${user.id}`,
            image: imgUrl
          }
        };

        const crawlerHtml = `
          <nav aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/explore">Creators</a> &gt; <span>${escapeHtml(user.name)}</span></nav>
          <h1>${escapeHtml(user.name)}</h1>
          <p>${escapeHtml(description)}</p>
        `;

        return {
          title,
          description,
          canonical: `https://lokaya.shop/user/${user.id}`,
          og: {
            title,
            description,
            image: imgUrl,
            url: `https://lokaya.shop/user/${user.id}`,
            type: 'profile'
          },
          jsonLd,
          crawlerHtml
        };
      });
    }

    // 4. Fallback for generic dynamic routes
    if (normalizedPath.startsWith('/orders/')) {
      return resolveDynamicRouteWithSeo('/orders/1', '/orders/1.txt', null);
    }
    if (normalizedPath.startsWith('/post/')) {
      return resolveDynamicRouteWithSeo('/post/1', '/post/1.txt', null);
    }
    if (normalizedPath.startsWith('/reel/')) {
      return resolveDynamicRouteWithSeo('/reel/1', '/reel/1.txt', null);
    }
    if (normalizedPath.startsWith('/parcel/')) {
      return resolveDynamicRouteWithSeo('/parcel/1', '/parcel/1.txt', null);
    }

    // 5. Universal Fallback for HTML Navigation
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      const notFoundRes = await env.ASSETS.fetch(new Request(new URL('/404', url.origin).toString(), request));
      if (notFoundRes.status === 200) {
        return new Response(notFoundRes.body, {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate'
          }
        });
      }
    }

    return exactAssetResponse;
  }
};
