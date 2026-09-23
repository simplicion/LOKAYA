import { prisma } from '@workspace/db';
import { redisClient } from '../../../shared/services/redis.service';

export class SearchService {
  async globalSearch(query: string, options?: { page?: number; limit?: number }) {
    if (!query || query.trim() === '') {
      return { users: [], stores: [], products: [], posts: [], pagination: { page: 1, limit: 20, hasMore: false } };
    }

    const trimmedQuery = query.trim();
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const cacheKey = `search:${trimmedQuery.toLowerCase()}:${page}:${limit}`;

    // 1. Check Cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Redis Cache Error', e);
    }

    const tokens = trimmedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t: string) => t.length > 0);
    const offset = (page - 1) * limit;

    // 2. Perform Parallel DB Queries
    const [users, stores, products, posts] = await Promise.all([
      // Users: ONLY users with active seller store roles
      prisma.user.findMany({
        where: {
          name: { contains: trimmedQuery, mode: 'insensitive' },
          stores: {
            some: {
              store: {
                isActive: true
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          stores: {
            where: { store: { isActive: true } },
            select: {
              store: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  category: true,
                  logoUrl: true,
                  isVerified: true
                }
              }
            },
            take: 1
          },
          _count: {
            select: { followers: true, following: true, posts: true }
          }
        },
        take: 10
      }),

      // Stores: Match by store metadata OR seller user's name
      prisma.store.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { title: { contains: trimmedQuery, mode: 'insensitive' } },
            { handle: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } },
            { description: { contains: trimmedQuery, mode: 'insensitive' } },
            {
              users: {
                some: {
                  user: {
                    name: { contains: trimmedQuery, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          title: true,
          category: true,
          logoUrl: true,
          bannerUrl: true,
          handle: true,
          status: true,
          isVerified: true,
          verificationStatus: true,
          workingDays: true,
          openingTime: true,
          closingTime: true,
          address: true,
          _count: {
            select: { products: true, reviews: true }
          },
          reviews: {
            select: { rating: true }
          }
        },
        take: 10
      }),

      // Products: Multi-token match across name, description, brand, category, sku
      prisma.product.findMany({
        where: {
          isActive: true,
          status: { not: 'ARCHIVED' },
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { description: { contains: trimmedQuery, mode: 'insensitive' } },
            { brand: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } },
            { sku: { contains: trimmedQuery, mode: 'insensitive' } },
            ...(tokens.length > 1 ? [{
              AND: tokens.map((token: string) => ({
                OR: [
                  { name: { contains: token, mode: 'insensitive' as const } },
                  { description: { contains: token, mode: 'insensitive' as const } },
                  { brand: { contains: token, mode: 'insensitive' as const } },
                  { category: { contains: token, mode: 'insensitive' as const } },
                  { sku: { contains: token, mode: 'insensitive' as const } }
                ]
              }))
            }] : [])
          ]
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              status: true,
              isVerified: true,
              verificationStatus: true
            }
          },
          media: {
            orderBy: { displayOrder: 'asc' }
          },
          reviews: {
            select: { rating: true }
          }
        },
        take: 50 // Candidate pool for algorithmic relevance scoring
      }),

      // Posts
      prisma.post.findMany({
        where: {
          OR: [
            { caption: { contains: trimmedQuery, mode: 'insensitive' } },
            {
              author: {
                name: { contains: trimmedQuery, mode: 'insensitive' }
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              stores: {
                include: {
                  store: {
                    select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
                  }
                }
              }
            }
          },
          productLinks: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
              }
            }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        take: 10
      })
    ]);

    // Algorithmic Relevance Scoring (Amazon/Flipkart Model)
    const scoredProducts = products.map((prod: any) => {
      let relevanceScore = 0;
      const lowerName = (prod.name || '').toLowerCase();
      const lowerDesc = (prod.description || '').toLowerCase();
      const lowerBrand = (prod.brand || '').toLowerCase();
      const lowerCategory = (prod.category || '').toLowerCase();
      const queryLower = trimmedQuery.toLowerCase();

      // 1. Exact phrase matches (highest priority)
      if (lowerName === queryLower) relevanceScore += 150;
      else if (lowerName.startsWith(queryLower)) relevanceScore += 80;
      else if (lowerName.includes(queryLower)) relevanceScore += 50;

      // 2. Multi-token matches
      tokens.forEach((t: string) => {
        if (lowerName.includes(t)) relevanceScore += 25;
        if (lowerBrand.includes(t)) relevanceScore += 20;
        if (lowerCategory.includes(t)) relevanceScore += 15;
        if (lowerDesc.includes(t)) relevanceScore += 5;
      });

      // 3. Stock availability boost
      if ((prod.stockCount ?? 0) > 0) relevanceScore += 15;

      // 4. Verified store boost
      if (prod.store?.isVerified && prod.store?.verificationStatus === 'APPROVED') {
        relevanceScore += 15;
      }

      // 5. Review & rating boost
      const avgRating = prod.reviews?.length > 0
        ? Number((prod.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / prod.reviews.length).toFixed(1))
        : 0;
      relevanceScore += avgRating * 4;

      return { prod, relevanceScore, avgRating };
    });

    // Sort by relevance score descending
    scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply batch windowing / pagination
    const paginatedProducts = scoredProducts.slice(offset, offset + limit);

    const results = {
      users,
      stores: stores.map((store: any) => {
        const avgRating = store.reviews.length > 0
          ? store.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / store.reviews.length
          : 0;
        return {
          ...store,
          isVerified: Boolean(store.isVerified && store.verificationStatus === 'APPROVED'),
          rating: avgRating > 0 ? avgRating.toFixed(1) : null,
          reviewsCount: store._count.reviews
        };
      }),
      products: paginatedProducts.map(({ prod, avgRating }: any) => {
        const primaryImage = prod.media?.[0]?.url || prod.imageUrl || '';
        const price = prod.sellingPrice ?? 0;
        const mrp = prod.mrp && prod.mrp > price ? prod.mrp : (prod.mrp || undefined);
        const discountLabel = mrp && mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined;

        return {
          id: prod.id,
          title: prod.name,
          name: prod.name,
          description: prod.description,
          image: primaryImage,
          primaryImage,
          price: price.toLocaleString('en-IN'),
          sellingPrice: price,
          originalPrice: mrp ? mrp.toLocaleString('en-IN') : undefined,
          mrp: mrp,
          discount: discountLabel,
          discountLabel: discountLabel,
          store: {
            id: prod.store?.id || '',
            name: prod.store?.name || 'Local Store',
            isVerified: Boolean(prod.store?.isVerified && prod.store?.verificationStatus === 'APPROVED')
          },
          rating: avgRating > 0 ? avgRating : 0,
          reviews: prod.reviews?.length ? `(${prod.reviews.length})` : '(0)',
          reviewsCount: prod.reviews?.length || 0,
        };
      }),
      posts: posts.map((post: any) => {
        const store = post.author.stores?.[0]?.store;
        const primaryProduct = post.productLinks?.[0]?.product;
        const mrp = primaryProduct?.mrp;
        const price = primaryProduct?.sellingPrice;

        return {
          id: post.id,
          authorId: post.author.id,
          caption: post.caption || '',
          createdAt: post.createdAt,
          timeAgo: 'Recently',
          storeId: store?.id || '',
          storeName: store?.name || post.author.name,
          storeAvatar: store?.logoUrl || post.author.avatarUrl || '',
          isVerified: Boolean(store?.isVerified && store?.verificationStatus === 'APPROVED'),
          media: post.media.map((m: any) => ({
            id: m.id,
            type: (m.type?.toLowerCase() || 'image') as 'image' | 'video',
            url: m.url,
            posterUrl: m.posterUrl || undefined,
            status: m.status,
            duration: m.duration ? `${Math.floor(m.duration / 60)}:${(m.duration % 60).toString().padStart(2, '0')}` : undefined,
          })),
          likes: post._count.likes.toLocaleString(),
          likesCount: post._count.likes,
          comments: post._count.comments.toString(),
          commentsCount: post._count.comments,
          shares: '0',
          hashtags: [],
          product: primaryProduct ? {
            id: primaryProduct.id,
            name: primaryProduct.name,
            image: primaryProduct.imageUrl || '',
            price: price !== undefined && price !== null ? String(price) : '',
            originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
            discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
          } : undefined,
        };
      }),
      pagination: {
        page,
        limit,
        totalProducts: scoredProducts.length,
        hasMore: offset + limit < scoredProducts.length
      }
    };

    // 3. Cache for 2 minutes (120 seconds)
    try {
      await redisClient.setex(cacheKey, 120, JSON.stringify(results));
    } catch (e) {
      console.warn('Redis Cache Error', e);
    }

    // 4. Record search keyword asynchronously
    if (trimmedQuery.length >= 2) {
      this.trackSearchKeyword(trimmedQuery).catch(() => {});
    }

    return results;
  }

  async trackSearchKeyword(keyword: string) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return;

    try {
      await redisClient.zincrby('search:trending_keywords', 1, normalized);
    } catch {}

    try {
      await (prisma as any).searchLog.upsert({
        where: { keyword: normalized },
        update: {
          count: { increment: 1 },
          lastSearchedAt: new Date()
        },
        create: {
          keyword: normalized,
          count: 1,
          lastSearchedAt: new Date()
        }
      });
    } catch (e) {}
  }

  async getTrending(limit = 10) {
    let keywords: string[] = [];
    try {
      const topKeywords = await (prisma as any).searchLog.findMany({
        orderBy: { count: 'desc' },
        take: limit,
        select: { keyword: true }
      });
      keywords = topKeywords.map((k: any) => k.keyword);
    } catch (e) {}

    // Supplement dynamically with live catalog categories and brands if fewer than 6 keywords exist
    if (keywords.length < 6) {
      try {
        const products = await prisma.product.findMany({
          where: { isActive: true },
          select: { category: true, brand: true },
          take: 20
        });
        const dynamicSet = new Set<string>(keywords);
        for (const p of products) {
          if (p.category && p.category.trim()) dynamicSet.add(p.category.trim());
          if (p.brand && p.brand.trim()) dynamicSet.add(p.brand.trim());
          if (dynamicSet.size >= limit) break;
        }
        keywords = Array.from(dynamicSet);
      } catch (e) {}
    }

    return {
      trendingKeywords: keywords
    };
  }
}
