import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../../../shared/middleware/auth';
import { prisma } from '@workspace/db';

export const adminRouter: Router = Router();

// GET /api/v1/admin/stats
adminRouter.get('/stats', requireAuth, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [totalStores, pendingStores, verifiedStores, totalUsers, totalOrders] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: 'PENDING' } }),
      prisma.store.count({ where: { status: 'VERIFIED' } }),
      prisma.user.count(),
      prisma.order.count(),
    ]);

    res.status(200).json({
      totalStores,
      pendingStores,
      verifiedStores,
      totalUsers,
      totalOrders,
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

