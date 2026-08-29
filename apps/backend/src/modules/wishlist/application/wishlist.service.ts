import { prisma } from '@workspace/db';

export class WishlistService {
  async toggleWishlist(userId: string, productId: string) {
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });
      return { status: 'removed' };
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId,
          productId
        }
      });
      return { status: 'added' };
    }
  }

  async getWishlist(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            store: true,
            media: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
