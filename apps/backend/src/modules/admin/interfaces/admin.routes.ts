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
