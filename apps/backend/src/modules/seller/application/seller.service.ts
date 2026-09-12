import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class SellerService {
  async onboardStore(userId: string, data: any) {
    // Check if user already has a pending or verified store
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    const aadharPanFallback = data.aadhaarFrontUrl || data.panCardUrl || data.aadharPanUrl || null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const storeName = data.name?.trim() || user?.name || "My Store";

    if (existingStoreUser) {
      if (existingStoreUser.store.status === 'REJECTED') {
        // Resubmit KYC
        const store = await prisma.store.update({
          where: { id: existingStoreUser.storeId },
          data: {
            name: storeName,
            address: data.address || "Address not provided",
            contactPhone: data.contactPhone || user?.phone || null,
            aadhaarFrontUrl: data.aadhaarFrontUrl || null,
            aadhaarBackUrl: data.aadhaarBackUrl || null,
            panCardUrl: data.panCardUrl || null,
            aadharPanUrl: aadharPanFallback,
            gstOrLicenseUrl: data.gstOrLicenseUrl || null,
            shopPhotos: data.shopPhotos || [],
            status: 'PENDING',
          }
        });
        return store;
      }
      throw new AppError('User already has a store profile attached', 400);
    }

    const store = await prisma.store.create({
      data: {
        name: storeName,
        address: data.address || "Address not provided",
        contactPhone: data.contactPhone || user?.phone || null,
        logoUrl: data.logoUrl || user?.avatarUrl || null,
        category: data.category || null,
        description: data.description || null,
        aadhaarFrontUrl: data.aadhaarFrontUrl || null,
        aadhaarBackUrl: data.aadhaarBackUrl || null,
        panCardUrl: data.panCardUrl || null,
        aadharPanUrl: aadharPanFallback,
        gstOrLicenseUrl: data.gstOrLicenseUrl || null,
        shopPhotos: data.shopPhotos || [],
        status: 'PENDING',
        users: {
          create: {
            userId: userId
          }
        }
      }
    });

    return store;
  }

  async getMyStore(userId: string) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    if (!storeUser || !storeUser.store) {
      throw new AppError('Store not found for this user', 404);
    }

    return storeUser.store;
  }

  async updateStoreProfile(userId: string, storeId: string, data: any) {
    // Verify ownership
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId, storeId }
    });

    if (!storeUser) {
      throw new AppError('Unauthorized: You do not own this store', 403);
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data
    });

    return store;
  }

  async getPendingStores() {
    return await prisma.store.findMany({
      where: { status: 'PENDING' },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllStores(status?: string) {
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    return await prisma.store.findMany({
      where: whereClause,
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async verifyStore(storeId: string) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: { 
        status: 'VERIFIED',
        isActive: true
      }
    });
  }

  async rejectStore(storeId: string, reason?: string) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: { 
        status: 'REJECTED',
        isActive: false
      }
    });
  }

  async getStoreSummary(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { users: true }
    });

    if (!store) throw new AppError('Store not found', 404);

    const userIds = store.users.map(u => u.userId);

    // Aggregate reviews
    const reviewStats = await prisma.review.aggregate({
      where: { storeId },
      _avg: { rating: true },
      _count: { id: true }
    });

    const avgRating = reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0;
    const reviewCount = reviewStats._count.id || 0;

    let followersCount = 0;
    let followingCount = 0;

    if (userIds.length > 0) {
      const [followers, following] = await Promise.all([
        prisma.follow.count({ where: { followingId: { in: userIds } } }),
        prisma.follow.count({ where: { followerId: { in: userIds } } })
      ]);
      followersCount = followers;
      followingCount = following;
    }

    const [postsCount, reelsCount] = await Promise.all([
      prisma.post.count({
        where: {
          OR: [
            ...(userIds.length > 0 ? [{ authorId: { in: userIds } }] : []),
            { productLinks: { some: { product: { storeId } } } }
          ]
        }
      }),
      prisma.reel.count({
        where: {
          OR: [
            ...(userIds.length > 0 ? [{ authorId: { in: userIds } }] : []),
            { productLinks: { some: { product: { storeId } } } }
          ]
        }
      })
    ]);

    // Calculate open/closed status based on openingTime and closingTime
    let isOpen = store.isActive ?? true;
    let timingLabel = store.closingTime ? `Open until ${store.closingTime}` : (store.openingTime ? `Open from ${store.openingTime}` : 'Open Now');

    return {
      store,
      avgRating,
      reviewCount,
      isOpen,
      timingLabel,
      followersCount,
      followingCount,
      postsCount,
      reelsCount
    };
  }

  async updateStoreTheme(userId: string, storeId: string, themeData: { themeColor?: string; secondaryColor?: string }) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId, storeId }
    });

    if (!storeUser) {
      throw new AppError('Unauthorized: You do not own this store', 403);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: {
        themeColor: themeData.themeColor,
        secondaryColor: themeData.secondaryColor
      }
    });
  }
}

