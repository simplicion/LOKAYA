import { ContentService } from './content.service';
import { prisma } from '@workspace/db';
import { S3Service } from '../infrastructure/s3.service';
import { AppError } from '../../../shared/errors/AppError';

jest.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    storeUser: {
      findFirst: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    reel: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    mediaAsset: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    productLink: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('../infrastructure/s3.service', () => ({
  S3Service: {
    generatePresignedUrl: jest.fn(),
  },
}));

jest.mock('../../media/application/media-worker.service', () => ({
  processMediaJob: jest.fn().mockResolvedValue(undefined),
}));

describe('ContentService Authorization & Social Publishing (YouTube/Instagram Model)', () => {
  const customerUserId = 'customer-user-123';
  const sellerUserId = 'seller-user-456';
  const storeId = 'store-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should allow normal users without a registered store to create posts freely', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: customerUserId, name: 'Alice Customer' });
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.post.create as jest.Mock).mockResolvedValue({
        id: 'post-cust-001',
        authorId: customerUserId,
        caption: 'Enjoying my weekend shopping!',
      });
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: 'post-cust-001',
        authorId: customerUserId,
        caption: 'Enjoying my weekend shopping!',
        media: [],
        productLinks: [],
        author: { id: customerUserId, name: 'Alice Customer' },
        _count: { likes: 0, comments: 0 },
      });

      const result = await ContentService.createPost(customerUserId, { caption: 'Enjoying my weekend shopping!' });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          authorId: customerUserId,
          caption: 'Enjoying my weekend shopping!',
        },
      });
      expect(result!.id).toBe('post-cust-001');
    });

    it('should allow post creation with tagged products if author is a registered seller', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: sellerUserId, name: 'Artisan Potter' });
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue({
        userId: sellerUserId,
        storeId,
        store: { id: storeId, name: 'Artisan Pottery' },
      });
      (prisma.post.create as jest.Mock).mockResolvedValue({
        id: 'post-001',
        authorId: sellerUserId,
        caption: 'Handcrafted mugs ready!',
      });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1' }]);
      (prisma.productLink.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: 'post-001',
        authorId: sellerUserId,
        caption: 'Handcrafted mugs ready!',
        media: [],
        productLinks: [{ productId: 'prod-1' }],
        author: { id: sellerUserId, name: 'Artisan Potter' },
        _count: { likes: 0, comments: 0 },
      });

      const result = await ContentService.createPost(sellerUserId, {
        caption: 'Handcrafted mugs ready!',
        productIds: ['prod-1'],
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          authorId: sellerUserId,
          caption: 'Handcrafted mugs ready!',
        },
      });
      expect(result!.id).toBe('post-001');
    });

    it('should throw 404 if author user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ContentService.createPost('non-existent-user', { caption: 'Ghost post' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Author user not found',
      });
    });
  });

  describe('createReel', () => {
    it('should allow normal users without a registered store to create reels freely', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: customerUserId, name: 'Bob Creator' });
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.reel.create as jest.Mock).mockResolvedValue({
        id: 'reel-cust-001',
        authorId: customerUserId,
        caption: 'Quick street food review',
      });
      (prisma.reel.findUnique as jest.Mock).mockResolvedValue({
        id: 'reel-cust-001',
        authorId: customerUserId,
        caption: 'Quick street food review',
        media: [],
        productLinks: [],
        author: { id: customerUserId, name: 'Bob Creator' },
        _count: { likes: 0, comments: 0 },
      });

      const result = await ContentService.createReel(customerUserId, { caption: 'Quick street food review' });

      expect(prisma.reel.create).toHaveBeenCalledWith({
        data: {
          authorId: customerUserId,
          caption: 'Quick street food review',
        },
      });
      expect(result!.id).toBe('reel-cust-001');
    });

    it('should allow reel creation if author is a registered seller with active store', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: sellerUserId, name: 'Silk Master' });
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue({
        userId: sellerUserId,
        storeId,
        store: { id: storeId, name: 'Silk Weavers' },
      });
      (prisma.reel.create as jest.Mock).mockResolvedValue({
        id: 'reel-001',
        authorId: sellerUserId,
        caption: 'Behind the scenes at loom',
      });
      (prisma.reel.findUnique as jest.Mock).mockResolvedValue({
        id: 'reel-001',
        authorId: sellerUserId,
        caption: 'Behind the scenes at loom',
        media: [],
        productLinks: [],
        author: { id: sellerUserId, name: 'Silk Master' },
        _count: { likes: 0, comments: 0 },
      });

      const result = await ContentService.createReel(sellerUserId, { caption: 'Behind the scenes at loom' });

      expect(prisma.reel.create).toHaveBeenCalledWith({
        data: {
          authorId: sellerUserId,
          caption: 'Behind the scenes at loom',
        },
      });
      expect(result!.id).toBe('reel-001');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned url for any authenticated user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: customerUserId });
      (S3Service.generatePresignedUrl as jest.Mock).mockResolvedValue({
        uploadUrl: 'https://s3.signed.url',
        publicUrl: 'https://cdn.url/uploads/video.mp4',
        key: 'uploads/video.mp4',
      });

      const res = await ContentService.getPresignedUrl('video.mp4', 'video/mp4', customerUserId);

      expect(S3Service.generatePresignedUrl).toHaveBeenCalledWith('video.mp4', 'video/mp4');
      expect(res.uploadUrl).toBe('https://s3.signed.url');
    });

    it('should throw 404 if userId is provided but user is not found in database', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ContentService.getPresignedUrl('video.mp4', 'video/mp4', 'invalid-user')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });
});
