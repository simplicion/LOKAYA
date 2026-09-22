/**
 * Cloudflare Pages Advanced Edge Router for Lokaya User App (Next.js App Router Static Export)
 *
 * Provides root-cause resolution for dynamic route hydration, RSC flight stream handling,
 * and eliminates infinite reload/redirect loops by serving protocol-aware responses.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Static Assets Pass-Through (JS chunks, CSS, images, icons, fonts, media)
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/images/') ||
      pathname.startsWith('/downloads/') ||
      /\.[a-zA-Z0-9]+$/.test(pathname)
    ) {
      return env.ASSETS.fetch(request);
    }

    // 2. Direct exact static route match (e.g. /home, /cart, /checkout, /login, /search, /profile, /seller, etc.)
    const exactAssetResponse = await env.ASSETS.fetch(request);
    if (exactAssetResponse.status < 400) {
      return exactAssetResponse;
    }

    // 3. Dynamic Route Resolution
    // Determine whether this is a React Server Component (RSC) flight payload request or an HTML browser navigation
    const isRSC = url.searchParams.has('_rsc') || request.headers.get('rsc') === '1';

    const resolveDynamicRoute = async (htmlPath, rscPath) => {
      if (isRSC) {
        const rscUrl = new URL(rscPath, url.origin);
        const rscRes = await env.ASSETS.fetch(new Request(rscUrl.toString(), {
          method: 'GET',
          headers: {
            ...Object.fromEntries(request.headers),
            'Accept': 'text/x-component'
          }
        }));

        if (rscRes.status < 400) {
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
      const pageUrl = new URL(htmlPath, url.origin);
      const pageRes = await env.ASSETS.fetch(new Request(pageUrl.toString(), request));
      if (pageRes.status < 400) {
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

    // --- Dynamic Route Matchers ---
    if (pathname.startsWith('/product/')) {
      return resolveDynamicRoute('/product/1.html', '/product/1.txt');
    }

    if (pathname.startsWith('/store/')) {
      if (pathname.includes('/category/')) {
        return resolveDynamicRoute('/store/1/category/1.html', '/store/1/category/1.txt');
      }
      return resolveDynamicRoute('/store/1.html', '/store/1.txt');
    }

    if (pathname.startsWith('/user/')) {
      return resolveDynamicRoute('/user/1.html', '/user/1.txt');
    }

    if (pathname.startsWith('/orders/')) {
      if (pathname.endsWith('/track')) {
        return resolveDynamicRoute('/orders/1/track.html', '/orders/1/track.txt');
      }
      if (pathname.endsWith('/invoice')) {
        return resolveDynamicRoute('/orders/1/invoice.html', '/orders/1/invoice.txt');
      }
      if (pathname.endsWith('/review')) {
        return resolveDynamicRoute('/orders/1/review.html', '/orders/1/review.txt');
      }
      return resolveDynamicRoute('/orders/1.html', '/orders/1.txt');
    }

    if (pathname.startsWith('/post/')) {
      return resolveDynamicRoute('/post/1.html', '/post/1.txt');
    }

    if (pathname.startsWith('/reel/')) {
      return resolveDynamicRoute('/reel/1.html', '/reel/1.txt');
    }

    if (pathname.startsWith('/parcel/')) {
      return resolveDynamicRoute('/parcel/1.html', '/parcel/1.txt');
    }

    if (pathname.startsWith('/seller/products/')) {
      if (pathname.endsWith('/edit')) {
        return resolveDynamicRoute('/seller/products/1/edit.html', '/seller/products/1/edit.txt');
      }
      return resolveDynamicRoute('/seller/products/1.html', '/seller/products/1.txt');
    }

    // 4. Default 404 handler
    return exactAssetResponse;
  }
};
