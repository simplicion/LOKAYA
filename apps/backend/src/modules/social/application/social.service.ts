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
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new AppError('Post not found', 404);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AppError('User not found', 404);

    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        postId,
        reelId: null
      }
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({ where: { postId } });
    return { liked, likesCount };
  }

  static async toggleLikeReel(userId: string, reelId: string) {
    const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { id: true } });
    if (!reel) throw new AppError('Reel not found', 404);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AppError('User not found', 404);

    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        reelId
      }
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId,
          reelId
        }
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({ where: { reelId } });
    return { liked, likesCount };
  }

  // ==========================================
  // Saved Posts & Reels
  // ==========================================

  static async toggleSavePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new AppError('Post not found', 404);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AppError('User not found', 404);

    const existing = await prisma.savedPost.findFirst({
      where: { userId, postId }
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    } else {
      await prisma.savedPost.create({
        data: { userId, postId }
      });
      return { saved: true };
    }
  }

  static async toggleSaveReel(userId: string, reelId: string) {
    const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { id: true } });
    if (!reel) throw new AppError('Reel not found', 404);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AppError('User not found', 404);

    const existing = await prisma.savedPost.findFirst({
      where: { userId, reelId }
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    } else {
      await prisma.savedPost.create({
        data: { userId, reelId }
      });
      return { saved: true };
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
  // ==========================================
  // Likes List
  // ==========================================

  static async getPostLikes(postId: string) {
    return await prisma.like.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
  }

  static async getReelLikes(reelId: string) {
    return await prisma.like.findMany({
      where: { reelId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
  }

  // ==========================================
  // Reporting
  // ==========================================

  static async reportContent(userId: string, targetId: string, targetType: 'POST' | 'REEL', reason: string) {
    return await prisma.report.create({
      data: {
        userId,
        reason,
        ...(targetType === 'POST' ? { postId: targetId } : { reelId: targetId })
      }
    });
  }

}
