import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class SocialService {
  
  // ==========================================
  // Follows
  // ==========================================

  static async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('You cannot follow yourself', 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return { following: false };
    } else {
      await prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      });
      return { following: true };
    }
  }

  // ==========================================
  // Likes
  // ==========================================

  static async toggleLikePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);

    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        postId,
        reelId: null
      }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      });
      return { liked: true };
    }
  }

  static async toggleLikeReel(userId: string, reelId: string) {
    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new AppError('Reel not found', 404);

    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        reelId
      }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    } else {
      await prisma.like.create({
        data: {
          userId,
          reelId
        }
      });
      return { liked: true };
    }
  }

  // ==========================================
  // Comments
  // ==========================================

  static async addCommentToPost(userId: string, postId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);

    return await prisma.comment.create({
      data: {
        userId,
        postId,
        content
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }

  static async addCommentToReel(userId: string, reelId: string, content: string) {
    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new AppError('Reel not found', 404);

    return await prisma.comment.create({
      data: {
        userId,
        reelId,
        content
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }

  static async getPostComments(postId: string) {
    return await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }

  static async getReelComments(reelId: string) {
    return await prisma.comment.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }
}
