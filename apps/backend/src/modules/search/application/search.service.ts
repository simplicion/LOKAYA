import { prisma } from '@workspace/db';
import { redisClient } from '../../../shared/services/redis.service';

export class SearchService {
  async globalSearch(query: string) {
    if (!query || query.trim() === '') {
      return { users: [], stores: [], products: [], posts: [] };
    }

    const trimmedQuery = query.trim();
    const cacheKey = `search:${trimmedQuery.toLowerCase()}`;

    // 1. Check Cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Redis Cache Error', e);
    }

    // 2. Perform Parallel DB Queries
    const [users, stores, products, posts] = await Promise.all([
      // Users
      prisma.user.findMany({
        where: {
          name: { contains: trimmedQuery, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          _count: {
            select: { followers: true, following: true, posts: true }
          }
        },
        take: 10
      }),

      // Stores
      prisma.store.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { title: { contains: trimmedQuery, mode: 'insensitive' } },
            { handle: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } },
            { description: { contains: trimmedQuery, mode: 'insensitive' } }
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

      // Products
      prisma.product.findMany({
        where: {
          isActive: true,
          status: { not: 'ARCHIVED' },
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { description: { contains: trimmedQuery, mode: 'insensitive' } },
            { brand: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } },
            { sku: { contains: trimmedQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          media: {
            orderBy: { displayOrder: 'asc' }
          },
          reviews: {
            select: { rating: true }
          }
        },
        take: 20
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
                    select: { id: true, name: true, logoUrl: true, status: true }
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

    const results = {
      users,
      stores: stores.map((store: any) => {
        const avgRating = store.reviews.length > 0
          ? store.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / store.reviews.length
          : 0;
        return {
          ...store,
          rating: avgRating > 0 ? avgRating.toFixed(1) : null,
          reviewsCount: store._count.reviews
        };
      }),
      products: products.map((prod: any) => {
        const avgRating = prod.reviews?.length > 0
          ? prod.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / prod.reviews.length
          : 0;
        
        const primaryImage = prod.media?.[0]?.url || prod.imageUrl || '';
        const price = prod.sellingPrice ?? 0;
        const mrp = prod.mrp && prod.mrp > price ? prod.mrp : undefined;
        const discountLabel = mrp ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined;

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
            isVerified: Boolean(prod.store?.isVerified)
          },
          rating: avgRating > 0 ? avgRating.toFixed(1) : null,
          reviews: prod.reviews?.length ? `(${prod.reviews.length})` : null,
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
          isVerified: Boolean(store?.isVerified),
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
            price: `₹${price}`,
            originalPrice: mrp && mrp > price! ? `₹${mrp}` : undefined,
            discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
          } : undefined,
        };
      })
    };

    // 3. Cache for 2 minutes (120 seconds)
    try {
      await redisClient.setex(cacheKey, 120, JSON.stringify(results));
    } catch (e) {
      console.warn('Redis Cache Error', e);
    }

    return results;
  }
}
