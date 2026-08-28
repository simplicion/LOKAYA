import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class SellerService {
  async onboardStore(userId: string, data: any) {
    // Check if user already has a pending or verified store
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    if (existingStoreUser) {
      if (existingStoreUser.store.status === 'REJECTED') {
        // Resubmit KYC
        const store = await prisma.store.update({
          where: { id: existingStoreUser.storeId },
          data: {
            name: data.name,
            address: data.address || "Address not provided",
            contactPhone: data.contactPhone,
            aadharPanUrl: data.aadharPanUrl,
            gstOrLicenseUrl: data.gstOrLicenseUrl,
            shopPhotos: data.shopPhotos || [],
            status: 'PENDING',
          }
        });
        return store;
      }
      throw new AppError('User already has a store profile attached', 400);
    }

    const store = await prisma.store.create({
      data: {
        name: data.name,
        address: data.address || "Address not provided",
        contactPhone: data.contactPhone,
        aadharPanUrl: data.aadharPanUrl,
        gstOrLicenseUrl: data.gstOrLicenseUrl,
        shopPhotos: data.shopPhotos || [],
        status: 'PENDING',
        users: {
          create: {
            userId: userId
          }
        }
      }
    });

    return store;
  }

  async getMyStore(userId: string) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    if (!storeUser || !storeUser.store) {
      throw new AppError('Store not found for this user', 404);
    }

    return storeUser.store;
  }

  async updateStoreProfile(userId: string, storeId: string, data: any) {
    // Verify ownership
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId, storeId }
    });

    if (!storeUser) {
      throw new AppError('Unauthorized: You do not own this store', 403);
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data
    });

    return store;
  }
}
