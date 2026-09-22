/**
 * Cloudflare Pages Advanced Edge Router for Lokaya User App (Next.js App Router Static Export)
 *
 * Provides root-cause resolution for dynamic route hydration, RSC flight stream handling,
 * and eliminates blank screens and 308 redirect masking by serving clean-URL static assets.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Static Assets Pass-Through (JS chunks, CSS, images, icons, fonts, media, manifests)
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/images/') ||
      pathname.startsWith('/downloads/') ||
      /\.(ico|png|jpg|jpeg|svg|webp|gif|mp4|webm|woff|woff2|ttf|eot|css|js|txt|json|map|webmanifest|xml)$/i.test(pathname)
    ) {
      return env.ASSETS.fetch(request);
    }

    // 2. Direct exact static route match (e.g. /home, /cart, /checkout, /login, /search, /profile, /seller, etc.)
    const exactAssetResponse = await env.ASSETS.fetch(request);
    if (exactAssetResponse.status === 200) {
      return exactAssetResponse;
    }

    // 3. Dynamic Route Resolution
    // Normalize path by stripping trailing slashes for consistent segment matching
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const isRSC = url.searchParams.has('_rsc') || request.headers.get('rsc') === '1';

    const resolveDynamicRoute = async (cleanPath, rscPath) => {
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

      // Standard HTML document request
      // IMPORTANT: Request the clean URL (e.g. /product/1, NOT /product/1.html).
      // Cloudflare Pages ASSETS responds with a 308 redirect (0-byte body) when .html is requested,
      // but returns HTTP 200 with the full HTML payload when requesting clean paths without .html.
      const pageUrl = new URL(cleanPath, url.origin);
      let pageRes = await env.ASSETS.fetch(new Request(pageUrl.toString(), {
        method: 'GET',
        headers: Object.fromEntries(request.headers)
      }));

      // Follow redirect if ASSETS returns 3xx (301, 302, 307, 308)
      if (pageRes.status >= 300 && pageRes.status < 400 && pageRes.headers.has('location')) {
        const redirectLocation = pageRes.headers.get('location');
        const redirectUrl = new URL(redirectLocation, url.origin);
        pageRes = await env.ASSETS.fetch(new Request(redirectUrl.toString(), {
          method: 'GET',
          headers: Object.fromEntries(request.headers)
        }));
      }

      // Only return as 200 OK if we have an actual successful content response (2xx)
      if (pageRes.status >= 200 && pageRes.status < 300) {
        const newHeaders = new Headers(pageRes.headers);
        newHeaders.set('Content-Type', 'text/html; charset=utf-8');
        newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
        return new Response(pageRes.body, {
          status: 200,
          statusText: 'OK',
          headers: newHeaders
        });
      }

      return exactAssetResponse;
    };

    // --- Dynamic Route Matchers (Platform-Wide) ---

    // 1. Product Detail Page: /product/[id]
    if (normalizedPath.startsWith('/product/')) {
      return resolveDynamicRoute('/product/1', '/product/1.txt');
    }

    // 2. Store Pages: /store/[id] and /store/[id]/category/[categoryId]
    if (normalizedPath.startsWith('/store/')) {
      if (normalizedPath.includes('/category/')) {
        return resolveDynamicRoute('/store/1/category/1', '/store/1/category/1.txt');
      }
      return resolveDynamicRoute('/store/1', '/store/1.txt');
    }

    // 3. User Public Profile Page: /user/[id]
    if (normalizedPath.startsWith('/user/')) {
      return resolveDynamicRoute('/user/1', '/user/1.txt');
    }

    // 4. Orders Sub-Routes: /orders/[id], /orders/[id]/track, /orders/[id]/invoice, /orders/[id]/review
    if (normalizedPath.startsWith('/orders/')) {
      if (normalizedPath.endsWith('/track')) {
        return resolveDynamicRoute('/orders/1/track', '/orders/1/track.txt');
      }
      if (normalizedPath.endsWith('/invoice')) {
        return resolveDynamicRoute('/orders/1/invoice', '/orders/1/invoice.txt');
      }
      if (normalizedPath.endsWith('/review')) {
        return resolveDynamicRoute('/orders/1/review', '/orders/1/review.txt');
      }
      return resolveDynamicRoute('/orders/1', '/orders/1.txt');
    }

    // 5. Post Page: /post/[id]
    if (normalizedPath.startsWith('/post/')) {
      return resolveDynamicRoute('/post/1', '/post/1.txt');
    }

    // 6. Reel Page: /reel/[id]
    if (normalizedPath.startsWith('/reel/')) {
      return resolveDynamicRoute('/reel/1', '/reel/1.txt');
    }

    // 7. Parcel Tracking / Verification: /parcel/[id]
    if (normalizedPath.startsWith('/parcel/')) {
      return resolveDynamicRoute('/parcel/1', '/parcel/1.txt');
    }

    // 8. Seller Product Management: /seller/products/[id] and /seller/products/[id]/edit
    if (normalizedPath.startsWith('/seller/products/')) {
      if (normalizedPath.endsWith('/edit')) {
        return resolveDynamicRoute('/seller/products/1/edit', '/seller/products/1/edit.txt');
      }
      return resolveDynamicRoute('/seller/products/1', '/seller/products/1.txt');
    }

    // 4. Universal Fallback for HTML Navigation
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      // Try serving 404 page if exact asset wasn't found
      const notFoundRes = await env.ASSETS.fetch(new Request(new URL('/404', url.origin).toString(), request));
      if (notFoundRes.status === 200) {
        return notFoundRes;
      }
    }

    return exactAssetResponse;
  }
};
