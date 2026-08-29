import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { S3Service } from '../infrastructure/s3.service';

export class ContentService {
  
  static async getPresignedUrl(filename: string, contentType: string) {
    return await S3Service.generatePresignedUrl(filename, contentType);
  }

  static async createPost(authorId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // Create post
      const post = await tx.post.create({
        data: {
          authorId,
          caption: data.caption
        }
      });

      // Attach media
      if (data.media && data.media.length > 0) {
        await tx.mediaAsset.createMany({
          data: data.media.map((m: any) => ({
            url: m.url,
            type: m.type,
            postId: post.id,
            status: 'READY'
          }))
        });
      }
      if (data.mediaIds && data.mediaIds.length > 0) {
        await tx.mediaAsset.updateMany({
          where: { id: { in: data.mediaIds } },
          data: { postId: post.id }
        });
      }

      // Attach product links
      if (data.productIds && data.productIds.length > 0) {
        await tx.productLink.createMany({
          data: data.productIds.map((productId: string) => ({
            productId,
            postId: post.id
          }))
        });
      }

      return await tx.post.findUnique({
        where: { id: post.id },
        include: {
          media: true,
          productLinks: {
            include: { product: true }
          },
          author: {
            select: { id: true, name: true }
          }
        }
      });
    });
  }

  static async createReel(authorId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // Create reel
      const reel = await tx.reel.create({
        data: {
          authorId,
          caption: data.caption
        }
      });

      // Attach media
      if (data.media && data.media.length > 0) {
        await tx.mediaAsset.createMany({
          data: data.media.map((m: any) => ({
            url: m.url,
            type: m.type,
            reelId: reel.id,
            status: 'READY'
          }))
        });
      }
      if (data.mediaIds && data.mediaIds.length > 0) {
        await tx.mediaAsset.updateMany({
          where: { id: { in: data.mediaIds } },
          data: { reelId: reel.id }
        });
      }

      // Attach product links
      if (data.productIds && data.productIds.length > 0) {
        await tx.productLink.createMany({
          data: data.productIds.map((productId: string) => ({
            productId,
            reelId: reel.id
          }))
        });
      }

      return await tx.reel.findUnique({
        where: { id: reel.id },
        include: {
          media: true,
          productLinks: {
            include: { product: true }
          },
          author: {
            select: { id: true, name: true }
          }
        }
      });
    });
  }

  static async getPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        author: {
          select: { id: true, name: true }
        },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
  }

  static async getReels(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return await prisma.reel.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        author: {
          select: { id: true, name: true }
        },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
  }
}
