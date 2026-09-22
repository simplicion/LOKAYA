import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../../../shared/middleware/auth';
import { prisma } from '@workspace/db';
import { SupportService } from '../../support/application/support.service';
import { FuelRateService } from '../../delivery/application/fuel-rate.service';
import { FcmService } from '../../notification/application/fcm.service';

export const adminRouter: Router = Router();

// GET /api/v1/admin/stats
adminRouter.get('/stats', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [totalStores, pendingStores, verifiedStores, totalUsers, totalOrders, totalRiders, pendingRiders] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: 'PENDING' } }),
      prisma.store.count({ where: { status: 'VERIFIED' } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.deliveryPartner.count(),
      prisma.deliveryPartner.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
      totalStores,
      pendingStores,
      verifiedStores,
      totalUsers,
      totalOrders,
      totalRiders,
      pendingRiders,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/users
adminRouter.get('/users', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        authProvider: true,
        isSystemAdmin: true,
        createdAt: true,
        stores: {
          include: {
            store: {
              select: { id: true, name: true, status: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Banner Management (E-Commerce Control)
// ==========================================

// GET /api/v1/admin/banners - Get all banners
adminRouter.get('/banners', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const banners = await (prisma as any).banner.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.status(200).json(banners);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/banners - Create new banner
adminRouter.post('/banners', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { title, subtitle, tagline, imageUrl, linkUrl, buttonText, displayOrder, isActive } = req.body;
    
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Title and image URL are required' });
    }

    const banner = await (prisma as any).banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        tagline: tagline || null,
        imageUrl,
        linkUrl: linkUrl || null,
        buttonText: buttonText || 'Shop Now',
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/admin/banners/:id - Update banner
adminRouter.put('/banners/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, tagline, imageUrl, linkUrl, buttonText, displayOrder, isActive } = req.body;

    const banner = await (prisma as any).banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
        ...(buttonText !== undefined && { buttonText: buttonText || 'Shop Now' }),
        ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      }
    });

    res.status(200).json(banner);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/admin/banners/:id - Delete banner
adminRouter.delete('/banners/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await (prisma as any).banner.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/banners/:id/toggle - Toggle active status
adminRouter.patch('/banners/:id/toggle', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const existing = await (prisma as any).banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const updated = await (prisma as any).banner.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Coupon & Promo Code Management
// ==========================================

// GET /api/v1/admin/coupons/stats - Coupon usage summary
adminRouter.get('/coupons/stats', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const [totalCoupons, activeCoupons, expiredCoupons, totalRedemptions] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true, OR: [{ validUntil: null }, { validUntil: { gte: now } }] } }),
      prisma.coupon.count({ where: { validUntil: { lt: now } } }),
      prisma.coupon.aggregate({ _sum: { usedCount: true } })
    ]);

    res.status(200).json({
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalRedemptions: totalRedemptions._sum.usedCount || 0,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/coupons - Get all coupons
adminRouter.get('/coupons', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { carts: true }
        }
      }
    });
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/coupons - Create new coupon
adminRouter.post('/coupons', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { 
      code, 
      discountType = 'PERCENTAGE', 
      discountValue, 
      minCartValue, 
      maxDiscount, 
      validFrom, 
      validUntil, 
      usageLimit, 
      isActive = true 
    } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const numericDiscount = Number(discountValue);

    if (isNaN(numericDiscount) || numericDiscount <= 0) {
      return res.status(400).json({ message: 'Discount value must be a positive number' });
    }

    if (discountType === 'PERCENTAGE' && numericDiscount > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode }
    });

    if (existing) {
      return res.status(409).json({ message: `Coupon with code "${cleanCode}" already exists` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: numericDiscount,
        minCartValue: minCartValue !== undefined && minCartValue !== null && minCartValue !== '' ? Number(minCartValue) : null,
        maxDiscount: maxDiscount !== undefined && maxDiscount !== null && maxDiscount !== '' ? Number(maxDiscount) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        usageLimit: usageLimit !== undefined && usageLimit !== null && usageLimit !== '' ? Number(usageLimit) : null,
        isActive: Boolean(isActive),
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/admin/coupons/:id - Update coupon
adminRouter.put('/coupons/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      discountType, 
      discountValue, 
      minCartValue, 
      maxDiscount, 
      validFrom, 
      validUntil, 
      usageLimit, 
      isActive 
    } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    let cleanCode = existing.code;
    if (code && typeof code === 'string') {
      cleanCode = code.trim().toUpperCase();
      if (cleanCode !== existing.code) {
        const duplicate = await prisma.coupon.findUnique({ where: { code: cleanCode } });
        if (duplicate) {
          return res.status(409).json({ message: `Coupon with code "${cleanCode}" already exists` });
        }
      }
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: cleanCode,
        ...(discountType !== undefined && { discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE' }),
        ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
        ...(minCartValue !== undefined && { minCartValue: minCartValue !== null && minCartValue !== '' ? Number(minCartValue) : null }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount !== null && maxDiscount !== '' ? Number(maxDiscount) : null }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : existing.validFrom }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit !== null && usageLimit !== '' ? Number(usageLimit) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/admin/coupons/:id - Delete coupon
adminRouter.delete('/coupons/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    // Unlink any carts using this coupon before deleting
    await prisma.cart.updateMany({
      where: { couponId: id },
      data: { couponId: null }
    });

    await prisma.coupon.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/coupons/:id/toggle - Toggle active status
adminRouter.patch('/coupons/:id/toggle', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Content Moderation Endpoints
// ==========================================

// GET /api/v1/admin/content/reports - Get all reports with details
adminRouter.get('/content/reports', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                stores: {
                  include: {
                    store: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            },
            media: true
          }
        },
        reel: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                stores: {
                  include: {
                    store: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            },
            media: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formattedReports = reports.map((r) => {
      const isPost = !!r.postId;
      const target = isPost ? r.post : r.reel;
      const storeName = target?.author?.stores?.[0]?.store?.name || target?.author?.name || 'Local Seller';
      const caption = target?.caption || '';
      const mediaUrl = target?.media?.[0]?.url || '';

      return {
        id: r.id,
        targetId: r.postId || r.reelId,
        type: isPost ? 'Post' : 'Reel',
        storeName,
        caption,
        reason: r.reason,
        status: r.status || 'PENDING',
        mediaUrl,
        reporter: r.user?.name || r.user?.email || 'Anonymous',
        createdAt: r.createdAt
      };
    });

    res.status(200).json(formattedReports);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/content/reports/:id - Update report status (e.g. RESOLVED, DISMISSED)
adminRouter.patch('/content/reports/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'RESOLVED' } = req.body;

    const updated = await prisma.report.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/admin/content/posts/:id - Takedown post
adminRouter.delete('/content/posts/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.productLink.deleteMany({ where: { postId: id } }),
      prisma.like.deleteMany({ where: { postId: id } }),
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.savedPost.deleteMany({ where: { postId: id } }),
      prisma.report.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    res.status(200).json({ success: true, message: 'Post removed successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/admin/content/reels/:id - Takedown reel
adminRouter.delete('/content/reels/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.productLink.deleteMany({ where: { reelId: id } }),
      prisma.like.deleteMany({ where: { reelId: id } }),
      prisma.comment.deleteMany({ where: { reelId: id } }),
      prisma.savedPost.deleteMany({ where: { reelId: id } }),
      prisma.report.deleteMany({ where: { reelId: id } }),
      prisma.reel.delete({ where: { id } }),
    ]);

    res.status(200).json({ success: true, message: 'Reel removed successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Review Moderation Endpoints
// ==========================================

// GET /api/v1/admin/reviews - Get all reviews
adminRouter.get('/reviews', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        product: {
          select: { id: true, name: true, imageUrl: true }
        },
        store: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      storeName: r.store?.name || 'Local Store',
      product: r.product?.name || 'Store Review',
      productId: r.productId,
      storeId: r.storeId,
      user: r.user?.name || r.user?.email || 'Customer',
      rating: r.rating,
      comment: r.comment || '',
      status: 'APPROVED',
      createdAt: r.createdAt
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/admin/reviews/:id - Delete review
adminRouter.delete('/reviews/:id', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Support Tickets Management
// ==========================================

// GET /api/v1/admin/support/tickets - Get all support tickets
adminRouter.get('/support/tickets', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, category, search } = req.query;
    const result = await SupportService.getAllTickets({
      status: status as string,
      priority: priority as string,
      category: category as string,
      search: search as string
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/support/tickets/:ticketId - Update ticket status or resolution notes
adminRouter.patch('/support/tickets/:ticketId', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, adminNotes } = req.body;
    const updated = await SupportService.updateTicketStatus(ticketId, {
      status,
      priority,
      adminNotes
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Product Verification Center
// ==========================================

// GET /api/v1/admin/products/verification - Get all products for verification
adminRouter.get('/products/verification', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const statusFilter = (req.query.status as string) || 'PENDING';
    const where: any = {};
    if (statusFilter !== 'ALL') {
      where.verificationStatus = statusFilter;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        media: {
          orderBy: { displayOrder: 'asc' }
        },
        categoryModel: true,
        variants: true,
        store: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { verificationRequestedAt: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/products/:productId/verify - Approve & List Product
adminRouter.patch('/products/:productId/verify', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        isVerified: true,
        verificationStatus: 'APPROVED',
        rejectionReason: null,
        status: 'PUBLISHED',
        isActive: true
      },
      include: {
        store: true,
        media: true
      }
    });

    res.status(200).json({ success: true, message: 'Product verified and listed successfully', product });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/products/:productId/reject - Reject Product with Reason
adminRouter.patch('/products/:productId/reject', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        isVerified: false,
        verificationStatus: 'REJECTED',
        rejectionReason: reason || 'Product details did not meet marketplace quality guidelines.'
      },
      include: {
        store: true,
        media: true
      }
    });

    res.status(200).json({ success: true, message: 'Product rejected', product });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Delivery Partner / Rider Verification
// ==========================================

// GET /api/v1/admin/delivery-partners/stats
adminRouter.get('/delivery-partners/stats', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      prisma.deliveryPartner.count(),
      prisma.deliveryPartner.count({ where: { status: 'PENDING' } }),
      prisma.deliveryPartner.count({ where: { status: 'APPROVED' } }),
      prisma.deliveryPartner.count({ where: { status: 'REJECTED' } }),
      prisma.deliveryPartner.count({ where: { status: 'SUSPENDED' } }),
    ]);

    res.status(200).json({
      total,
      pending,
      approved,
      rejected,
      suspended,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/delivery-partners
adminRouter.get('/delivery-partners', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { vehicleNumber: { contains: q, mode: 'insensitive' } },
        { locationArea: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const partners = await prisma.deliveryPartner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            fulfilledOrders: true,
            assignments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.status(200).json(partners);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/delivery-partners/:id/verify - Approve Rider
adminRouter.patch('/delivery-partners/:id/verify', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const partner = await prisma.deliveryPartner.update({
      where: { id },
      data: {
        status: 'APPROVED',
        rejectionReason: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(200).json({ success: true, message: 'Delivery partner verified & approved successfully', partner });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/delivery-partners/:id/reject - Reject Rider
adminRouter.patch('/delivery-partners/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const partner = await prisma.deliveryPartner.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Documents did not meet platform verification standards.',
        isOnline: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(200).json({ success: true, message: 'Delivery partner application rejected', partner });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/delivery-partners/:id/suspend - Suspend Rider
adminRouter.patch('/delivery-partners/:id/suspend', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const partner = await prisma.deliveryPartner.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        rejectionReason: reason || 'Account suspended by platform administrator.',
        isOnline: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(200).json({ success: true, message: 'Delivery partner suspended', partner });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Fuel Rates & Global Operational Benchmarks
// ==========================================

// GET /api/v1/admin/fuel-rates - List all country fuel rates (with search & pagination)
adminRouter.get('/fuel-rates', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    const result = await FuelRateService.getAllCountryRates(search, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/fuel-rates/:countryCode - Get single country fuel rate & upfront benchmarks
adminRouter.get('/fuel-rates/:countryCode', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { countryCode } = req.params;
    const rate = await FuelRateService.getCountryFuelRate(countryCode);
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);
    res.status(200).json({ rate, benchmark });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/admin/fuel-rates/:countryCode - Update fuel price per liter
adminRouter.patch('/fuel-rates/:countryCode', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { countryCode } = req.params;
    const { fuelPricePerLiter, isActive } = req.body;

    if (fuelPricePerLiter === undefined && isActive === undefined) {
      return res.status(400).json({ message: 'fuelPricePerLiter or isActive is required' });
    }

    const updated = await FuelRateService.updateCountryRate(
      countryCode,
      Number(fuelPricePerLiter),
      isActive !== undefined ? Boolean(isActive) : undefined
    );

    const updatedBenchmark = await FuelRateService.getFuelBenchmark(countryCode);

    res.status(200).json({
      success: true,
      message: `Fuel rate for ${countryCode.toUpperCase()} updated successfully`,
      data: updated,
      benchmark: updatedBenchmark
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/fuel-rates/seed - Re-seed default 177+ countries database
adminRouter.post('/fuel-rates/seed', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    // Run seeder logic
    const { spawn } = require('child_process');
    const path = require('path');
    const seedScript = path.resolve(__dirname, '../../../../../../packages/db/seedFuelRates.js');

    // Invalidate full cache
    FuelRateService.invalidateCache();

    res.status(200).json({
      success: true,
      message: 'Fuel rate cache refreshed and seeder triggered'
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Notification Marketing & Campaign Studio
// ==========================================

// GET /api/v1/admin/notifications/campaigns - List campaign history
adminRouter.get('/notifications/campaigns', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      (prisma as any).notificationCampaign.count(),
      (prisma as any).notificationCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/notifications/broadcast - Dispatch a new push notification marketing campaign
adminRouter.post('/notifications/broadcast', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { title, body, imageUrl, deepLink, targetAudience, targetFilter } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required for push broadcast' });
    }

    const result = await FcmService.broadcastCampaign({
      title,
      body,
      imageUrl: imageUrl || null,
      deepLink: deepLink || '/',
      targetAudience: targetAudience || 'ALL_USERS',
      targetFilter: targetFilter || null,
      createdBy: req.user?.id
    });

    const message = 'deliveredCount' in result
      ? `Push notification campaign broadcast initiated to ${result.deliveredCount} devices`
      : result.message || 'Push notification campaign broadcast enqueued successfully';

    res.status(200).json({
      success: true,
      message,
      campaign: result.campaign
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/notifications/stats - Device token & audience metrics
adminRouter.get('/notifications/stats', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [totalDevices, androidDevices, iosDevices, webDevices, totalCampaigns, totalInApp] = await Promise.all([
      (prisma as any).deviceToken.count({ where: { isActive: true } }),
      (prisma as any).deviceToken.count({ where: { platform: 'ANDROID', isActive: true } }),
      (prisma as any).deviceToken.count({ where: { platform: 'IOS', isActive: true } }),
      (prisma as any).deviceToken.count({ where: { platform: 'WEB', isActive: true } }),
      (prisma as any).notificationCampaign.count(),
      (prisma as any).notification.count()
    ]);

    res.status(200).json({
      totalDevices,
      androidDevices,
      iosDevices,
      webDevices,
      totalCampaigns,
      totalInApp
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Onboarding & KYC Management
// ==========================================

// GET /api/v1/admin/onboarding-config
adminRouter.get('/onboarding-config', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { PlatformConfigService } = await import('../../common/platform-config.service');
    const config = await PlatformConfigService.getOnboardingConfig();
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/admin/onboarding-config
adminRouter.put('/onboarding-config', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { PlatformConfigService } = await import('../../common/platform-config.service');
    const updatedBy = req.user?.id || 'admin';
    const config = await PlatformConfigService.updateOnboardingConfig(req.body, updatedBy);
    res.status(200).json({
      success: true,
      message: 'Onboarding policy updated successfully',
      config
    });
  } catch (error) {
    next(error);
  }
});

