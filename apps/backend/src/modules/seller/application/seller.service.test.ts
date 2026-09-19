import { SellerService } from './seller.service';
import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

jest.mock('@workspace/db', () => ({
  prisma: {
    storeUser: {
      findFirst: jest.fn(),
    },
    store: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('SellerService', () => {
  let sellerService: SellerService;

  beforeEach(() => {
    sellerService = new SellerService();
    jest.clearAllMocks();
  });

  describe('getMyStore', () => {
    it('should return null when the user has no store linked', async () => {
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue(null);

      const store = await sellerService.getMyStore('user-without-store-id');

      expect(store).toBeNull();
      expect(prisma.storeUser.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-without-store-id' },
        include: { store: true },
      });
    });

    it('should return the store when the user has a store linked', async () => {
      const mockStore = {
        id: 'store-123',
        name: 'Test Artisan Store',
        status: 'VERIFIED',
      };
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue({
        userId: 'seller-user-id',
        storeId: 'store-123',
        store: mockStore,
      });

      const store = await sellerService.getMyStore('seller-user-id');

      expect(store).toEqual(mockStore);
    });
  });

  describe('updateStoreProfile', () => {
    it('should throw 403 if the user does not own the store', async () => {
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        sellerService.updateStoreProfile('intruder-id', 'store-123', { name: 'Hacked Store' })
      ).rejects.toThrow(AppError);

      expect(prisma.store.update).not.toHaveBeenCalled();
    });

    it('should update store and sync coordinates to user table when lat/lng are provided', async () => {
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue({
        userId: 'seller-1',
        storeId: 'store-1',
      });
      const updatedMockStore = {
        id: 'store-1',
        name: 'Updated Store',
        latitude: 27.7172,
        longitude: 85.324,
      };
      (prisma.store.update as jest.Mock).mockResolvedValue(updatedMockStore);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await sellerService.updateStoreProfile('seller-1', 'store-1', {
        name: 'Updated Store',
        latitude: 27.7172,
        longitude: 85.324,
      });

      expect(result).toEqual(updatedMockStore);
      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: {
          name: 'Updated Store',
          latitude: 27.7172,
          longitude: 85.324,
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: {
          latitude: 27.7172,
          longitude: 85.324,
        },
      });
    });
  });

  describe('onboardStore', () => {
    it('should onboard store with universal KYC and coordinates successfully', async () => {
      (prisma.storeUser.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-kyc-1',
        name: 'Global Artisan',
        phone: '+14155552671',
      });
      const createdMockStore = {
        id: 'store-kyc-1',
        name: 'Global Crafts',
        status: 'PENDING',
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        country: 'United States',
      };
      (prisma.store.create as jest.Mock).mockResolvedValue(createdMockStore);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await sellerService.onboardStore('user-kyc-1', {
        name: 'Global Crafts',
        ownerIdFrontUrl: 'https://s3.example.com/passport.jpg',
        businessDocUrl: 'https://s3.example.com/ein_certificate.pdf',
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        state: 'NY',
        country: 'United States',
        countryCode: 'US',
        currency: 'USD',
        currencySymbol: '$',
      });

      expect(result).toEqual(createdMockStore);
      expect(prisma.store.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-kyc-1' },
        data: expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York',
        }),
      });
    });
  });
});
