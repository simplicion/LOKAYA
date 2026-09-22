import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { PlatformConfigService } from '../../common/platform-config.service';

export class SellerService {
  async onboardStore(userId: string, data: any) {
    // Role Exclusivity Check: Single Operational Role Rule
    const existingDeliveryPartner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });
    if (existingDeliveryPartner) {
      throw new AppError(
        'You are already registered as a Delivery Partner. Under Lokaya single-role policy, please use a separate account to create a Seller store.',
        400
      );
    }

    // Check if user already has a pending or verified store
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    const frontDoc = data.ownerIdFrontUrl || data.aadhaarFrontUrl || null;
    const backDoc = data.ownerIdBackUrl || data.aadhaarBackUrl || null;
    const photoDoc = data.ownerPhotoUrl || data.panCardUrl || null;
    const aadharPanFallback = frontDoc || photoDoc || data.aadharPanUrl || null;
    const businessDoc = data.businessDocUrl || data.gstOrLicenseUrl || null;

    const lat = typeof data.latitude === 'number' ? data.latitude : null;
    const lng = typeof data.longitude === 'number' ? data.longitude : null;
    const detectedCity = data.city || null;
    const detectedState = data.state || null;
    const detectedCountry = data.country || null;
    const detectedCountryCode = data.countryCode || null;
    const detectedCurrency = data.currency || null;
    const detectedCurrencySymbol = data.currencySymbol || null;

    const locationSummary = detectedCountry
      ? `${detectedCountry} (${detectedCountryCode || ''}) · Currency: ${detectedCurrency || ''} (${detectedCurrencySymbol || ''})`
      : null;

    const storeAddress = data.address && data.address !== "Address not provided"
      ? data.address
      : [detectedCity, detectedState, detectedCountry].filter(Boolean).join(', ') || "";

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const storeName = data.name?.trim() || user?.name || "My Store";

    // Dynamic Onboarding Policy: Fast-track auto-approval vs strict KYC verification
    const config = await PlatformConfigService.getOnboardingConfig();
    const shouldAutoApprove = !config.requireSellerDocs || config.autoApproveSeller;
    const initialStatus: 'VERIFIED' | 'PENDING' = shouldAutoApprove ? 'VERIFIED' : 'PENDING';
    const initialVerificationStatus = shouldAutoApprove ? 'APPROVED' : (config.requireSellerDocs ? 'PENDING' : 'APPROVED');
    const isVerified = shouldAutoApprove;

    if (existingStoreUser) {
      if (existingStoreUser.store.status === 'REJECTED') {
        // Resubmit KYC
        const store = await prisma.store.update({
          where: { id: existingStoreUser.storeId },
          data: {
            name: storeName,
            address: storeAddress,
            category: data.category || undefined,
            contactPhone: data.contactPhone || user?.phone || null,
            latitude: lat,
            longitude: lng,
            city: detectedCity,
            state: detectedState,
            landmark: locationSummary,
            aadhaarFrontUrl: frontDoc,
            aadhaarBackUrl: backDoc,
            panCardUrl: photoDoc,
            aadharPanUrl: aadharPanFallback,
            gstOrLicenseUrl: businessDoc,
            shopPhotos: data.shopPhotos || [],
            status: initialStatus,
            isVerified: isVerified,
            verificationStatus: initialVerificationStatus,
          }
        });

        if (lat !== null && lng !== null) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              latitude: lat,
              longitude: lng,
              city: detectedCity || undefined,
              state: detectedState || undefined,
              locationArea: [detectedCity, detectedState, detectedCountry].filter(Boolean).join(', ') || undefined,
            }
          }).catch(() => {});
        }

        return store;
      }
      throw new AppError('User already has a store profile attached', 400);
    }

    const store = await prisma.store.create({
      data: {
        name: storeName,
        address: storeAddress,
        contactPhone: data.contactPhone || user?.phone || null,
        logoUrl: data.logoUrl || user?.avatarUrl || null,
        category: data.category || null,
        description: data.description || null,
        latitude: lat,
        longitude: lng,
        city: detectedCity,
        state: detectedState,
        landmark: locationSummary,
        aadhaarFrontUrl: frontDoc,
        aadhaarBackUrl: backDoc,
        panCardUrl: photoDoc,
        aadharPanUrl: aadharPanFallback,
        gstOrLicenseUrl: businessDoc,
        shopPhotos: data.shopPhotos || [],
        status: initialStatus,
        isVerified: isVerified,
        verificationStatus: initialVerificationStatus,
        users: {
          create: {
            userId: userId
          }
        }
      }
    });

    if (lat !== null && lng !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          latitude: lat,
          longitude: lng,
          city: detectedCity || undefined,
          state: detectedState || undefined,
          locationArea: [detectedCity, detectedState, detectedCountry].filter(Boolean).join(', ') || undefined,
        }
      }).catch(() => {});
    }

    return store;
  }

  async getMyStore(userId: string) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    if (!storeUser || !storeUser.store) {
      return null;
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

    if (data.logoUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: data.logoUrl }
      }).catch(err => console.warn('Could not sync user avatarUrl:', err));
    }

    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
        }
      }).catch(err => console.warn('Could not sync user location coordinates:', err));
    }

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
      if (status === 'PENDING') {
        whereClause.OR = [
          { status: 'PENDING' },
          { verificationStatus: 'PENDING' }
        ];
      } else {
        whereClause.status = status;
      }
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

  async getExploreStores(query?: { category?: string; search?: string }) {
    const whereClause: any = {
      status: 'VERIFIED',
      isActive: true,
    };

    if (query?.category && query.category.toLowerCase() !== 'all') {
      whereClause.category = {
        contains: query.category,
        mode: 'insensitive',
      };
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: true,
            reviews: true,
          }
        },
        reviews: {
          select: { rating: true },
          take: 50,
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return stores.map((store) => {
      const totalRatings = store.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = store.reviews.length > 0 ? Number((totalRatings / store.reviews.length).toFixed(1)) : 0;
      
      const lat = store.latitude ?? null;
      const lng = store.longitude ?? null;

      return {
        id: store.id,
        name: store.name,
        category: store.category || 'Store',
        address: store.address || (store.city ? `${store.city}, India` : ''),
        city: store.city,
        state: store.state,
        lat,
        lng,
        image: store.logoUrl || store.bannerUrl || '',
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        isOpen: store.isActive,
        rating: avgRating,
        reviews: store._count.reviews || store.reviews.length,
        productCount: store._count.products,
        distance: '',
      };
    });
  }

  async requestVerification(userId: string, storeId: string) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId, storeId }
    });

    if (!storeUser) {
      throw new AppError('Unauthorized: You do not own this store', 403);
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    if (store.isVerified && store.verificationStatus === 'APPROVED') {
      throw new AppError('Store is already verified with blue tick', 400);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: {
        verificationStatus: 'PENDING',
        verificationRequestedAt: new Date()
      }
    });
  }

  /**
   * Approves store KYC onboarding documents so seller can sell and manage orders.
   * Note: This does NOT grant the Blue Tick badge. Blue Tick requires separate verification application.
   */
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

  /**
   * Rejects store KYC onboarding.
   */
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

  /**
   * Approves a dedicated Blue Tick Verification badge application.
   */
  async approveBlueTick(storeId: string) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: {
        isVerified: true,
        verificationStatus: 'APPROVED'
      }
    });
  }

  /**
   * Rejects a dedicated Blue Tick Verification badge application.
   */
  async rejectBlueTick(storeId: string, reason?: string) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await prisma.store.update({
      where: { id: storeId },
      data: {
        isVerified: false,
        verificationStatus: 'REJECTED'
      }
    });
  }

  async getStoreSummary(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
                phone: true,
                city: true,
                state: true
              }
            }
          }
        }
      }
    });

    if (!store) throw new AppError('Store not found', 404);

    const userIds = ((store as any).users || []).map((u: any) => u.userId);

    // Aggregate reviews across direct store feedback and all store products
    const reviewStats = await prisma.review.aggregate({
      where: {
        OR: [
          { storeId },
          { product: { storeId } }
        ]
      },
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

    const [postsCount, reelsCount, productsCount] = await Promise.all([
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
      }),
      prisma.product.count({
        where: { storeId }
      })
    ]);

    // Calculate open/closed status based on openingTime and closingTime
    let isOpen = store.isActive ?? true;
    let timingLabel: string | null = null;
    if (store.closingTime) {
      timingLabel = `Open until ${store.closingTime}`;
    } else if (store.openingTime) {
      timingLabel = `Open from ${store.openingTime}`;
    }

    return {
      store,
      avgRating,
      reviewCount,
      isOpen,
      timingLabel,
      followersCount,
      followingCount,
      postsCount,
      reelsCount,
      productsCount
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

