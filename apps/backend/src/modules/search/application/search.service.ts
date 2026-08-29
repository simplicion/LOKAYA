import { prisma } from '@workspace/db';
import { redisClient } from '../../../shared/services/redis.service';

export class SearchService {
  async globalSearch(query: string) {
    if (!query || query.trim() === '') {
      return { users: [], stores: [], products: [] };
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
    const [users, stores, products] = await Promise.all([
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
        take: 5
      }),

      // Stores
      prisma.store.findMany({
        where: {
          isActive: true,
          status: 'VERIFIED',
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { title: { contains: trimmedQuery, mode: 'insensitive' } },
            { handle: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } }
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
          _count: {
            select: { products: true, reviews: true }
          },
          reviews: {
            select: { rating: true }
          }
        },
        take: 5
      }),

      // Products
      prisma.product.findMany({
        where: {
          isActive: true,
          status: 'PUBLISHED',
          OR: [
            { name: { contains: trimmedQuery, mode: 'insensitive' } },
            { description: { contains: trimmedQuery, mode: 'insensitive' } },
            { brand: { contains: trimmedQuery, mode: 'insensitive' } },
            { category: { contains: trimmedQuery, mode: 'insensitive' } }
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
            where: { isPrimary: true },
            take: 1
          },
          reviews: {
            select: { rating: true }
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
          rating: avgRating.toFixed(1),
          reviewsCount: store._count.reviews
        };
      }),
      products: products.map((prod: any) => {
        const avgRating = prod.reviews.length > 0
          ? prod.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / prod.reviews.length
          : 0;
        
        let primaryImage = prod.media[0]?.url || prod.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200';
        return {
          ...prod,
          rating: avgRating.toFixed(1),
          reviewsCount: prod.reviews.length,
          primaryImage
        };
      })
    };

    // 3. Cache for 5 minutes (300 seconds)
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(results));
    } catch (e) {
      console.warn('Redis Cache Error', e);
    }

    return results;
  }
}
