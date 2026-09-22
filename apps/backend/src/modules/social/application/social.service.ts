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
    if (!post) {
      const reel = await prisma.reel.findUnique({ where: { id: postId }, select: { id: true } });
      if (reel) return this.toggleLikeReel(userId, postId);
      throw new AppError('Post not found', 404);
    }

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
    if (!post) {
      const reel = await prisma.reel.findUnique({ where: { id: postId }, select: { id: true } });
      if (reel) return this.toggleSaveReel(userId, postId);
      throw new AppError('Post not found', 404);
    }

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
    if (!post) {
      const reel = await prisma.reel.findUnique({ where: { id: postId } });
      if (reel) return this.addCommentToReel(userId, postId, content);
      throw new AppError('Post not found', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content: content.trim()
      },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
      }
    });

    const commentsCount = await prisma.comment.count({ where: { postId } });

    return {
      ...comment,
      commentsCount
    };
  }

  static async addCommentToReel(userId: string, reelId: string, content: string) {
    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new AppError('Reel not found', 404);

    const comment = await prisma.comment.create({
      data: {
        userId,
        reelId,
        content: content.trim()
      },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
      }
    });

    const commentsCount = await prisma.comment.count({ where: { reelId } });

    return {
      ...comment,
      commentsCount
    };
  }

  static async getPostComments(postId: string) {
    const postComments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
      }
    });

    if (postComments.length > 0) return postComments;
    return await this.getReelComments(postId);
  }

  static async getReelComments(reelId: string) {
    return await prisma.comment.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
      }
    });
  }
  // ==========================================
  // Likes List
  // ==========================================

  static async getPostLikes(postId: string) {
    const postLikes = await prisma.like.findMany({
      where: { postId },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
      }
    });

    if (postLikes.length > 0) return postLikes;
    return await this.getReelLikes(postId);
  }

  static async getReelLikes(reelId: string) {
    return await prisma.like.findMany({
      where: { reelId },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          } 
        }
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

  // ==========================================
  // Public User Profile
  // ==========================================

  static async getUserProfile(userId: string, currentUserId?: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        state: true,
        createdAt: true,
        stores: {
          include: {
            store: {
              select: { 
                id: true, 
                name: true, 
                logoUrl: true, 
                status: true, 
                description: true,
                category: true,
                isVerified: true,
                verificationStatus: true,
                address: true,
                contactPhone: true,
                openingTime: true,
                closingTime: true
              }
            }
          }
        },
        _count: {
          select: {
            posts: true,
            reels: true,
            followers: true,
            following: true
          }
        }
      }
    });

    // Fallback: If userId was actually a storeId, resolve its owner
    if (!user) {
      const storeUser = await prisma.storeUser.findFirst({
        where: { storeId: userId },
        select: { userId: true }
      });
      if (storeUser?.userId) {
        user = await prisma.user.findUnique({
          where: { id: storeUser.userId },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            city: true,
            state: true,
            createdAt: true,
            stores: {
              include: {
                store: {
                  select: { 
                    id: true, 
                    name: true, 
                    logoUrl: true, 
                    status: true, 
                    description: true,
                    category: true,
                    isVerified: true,
                    verificationStatus: true,
                    address: true,
                    contactPhone: true,
                    openingTime: true,
                    closingTime: true
                  }
                }
              }
            },
            _count: {
              select: {
                posts: true,
                reels: true,
                followers: true,
                following: true
              }
            }
          }
        });
      }
    }

    if (!user) throw new AppError('User not found', 404);

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    const [posts, reels] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          media: true,
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.reel.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          media: true,
          _count: {
            select: { likes: true, comments: true }
          }
        }
      })
    ]);

    return {
      ...user,
      isFollowing,
      posts,
      reels
    };
  }

  static async toggleFollowStore(followerId: string, storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        users: {
          select: { userId: true }
        }
      }
    });

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    const sellerUserId = store.users[0]?.userId;
    if (!sellerUserId) {
      throw new AppError('Store has no associated merchant owner', 400);
    }

    if (sellerUserId === followerId) {
      throw new AppError('You cannot follow your own store', 400);
    }

    return await this.toggleFollow(followerId, sellerUserId);
  }

  static async getStoreFollowStatus(currentUserId: string | undefined, storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        users: {
          select: { userId: true }
        }
      }
    });

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    const sellerUserIds = store.users.map(u => u.userId);
    let followersCount = 0;
    let isFollowing = false;

    if (sellerUserIds.length > 0) {
      followersCount = await prisma.follow.count({
        where: { followingId: { in: sellerUserIds } }
      });

      if (currentUserId) {
        const follow = await prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: { in: sellerUserIds }
          }
        });
        isFollowing = !!follow;
      }
    }

    return {
      following: isFollowing,
      followersCount
    };
  }

  static async getFollowedStores(userId: string) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = follows.map(f => f.followingId);
    if (followingIds.length === 0) {
      return [];
    }

    const stores = await prisma.store.findMany({
      where: {
        users: {
          some: {
            userId: { in: followingIds }
          }
        },
        isActive: true
      },
      include: {
        users: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            products: {
              where: { isActive: true }
            },
            reviews: true
          }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    return stores.map(store => {
      const avgRating = store.reviews?.length
        ? store.reviews.reduce((sum, r) => sum + r.rating, 0) / store.reviews.length
        : 0;

      return {
        id: store.id,
        name: store.name,
        handle: store.handle,
        description: store.description,
        address: store.address,
        city: store.city,
        state: store.state,
        category: store.category,
        logoUrl: store.logoUrl || store.users[0]?.user?.avatarUrl || null,
        bannerUrl: store.bannerUrl || null,
        status: store.status,
        isVerified: Boolean(store.isVerified && store.verificationStatus === 'APPROVED'),
        productsCount: store._count.products,
        reviewsCount: store._count.reviews,
        rating: avgRating > 0 ? Number(avgRating.toFixed(1)) : null,
        isFollowing: true
      };
    });
  }

  static async getShareRecipients(userId?: string) {
    const users = await prisma.user.findMany({
      where: userId ? { id: { not: userId } } : undefined,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        stores: {
          select: {
            store: {
              select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
            }
          }
        }
      },
      take: 12,
      orderBy: { createdAt: 'desc' }
    });

    return users.map(u => ({
      id: u.id,
      name: u.name || 'User',
      username: (u.name || 'user').toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: u.avatarUrl || u.stores?.[0]?.store?.logoUrl || null,
      isVerified: Boolean(u.stores?.[0]?.store?.isVerified && u.stores?.[0]?.store?.verificationStatus === 'APPROVED'),
      storeId: u.stores?.[0]?.store?.id || null
    }));
  }

  static async sendDirectShare(senderId: string, recipientId: string, shareUrl: string, message?: string) {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) throw new AppError('Recipient not found', 404);

    // Create notification for recipient
    try {
      await (prisma as any).notification.create({
        data: {
          userId: recipientId,
          type: 'DIRECT_SHARE',
          title: 'Shared a link with you',
          message: message ? `${message} - ${shareUrl}` : shareUrl,
          link: shareUrl
        }
      });
    } catch {}

    return { success: true, message: 'Shared successfully' };
  }
}

