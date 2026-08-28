import { Request, Response } from 'express';
import { prisma } from '@workspace/db';
import jwt from 'jsonwebtoken';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkStoreOpenStatus(store: any): boolean {
  if (!store.isActive) return false;
  if (!store.openingTime || !store.closingTime || !store.workingDays) return true; // Default to open if missing data

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon...
  
  if (!store.workingDays.includes(currentDay)) return false;

  const [openHour, openMin] = store.openingTime.split(':').map(Number);
  const [closeHour, closeMin] = store.closingTime.split(':').map(Number);
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

export class StoreController {
  
  // Register a new store (Onboarding)
  onboardStore = async (req: Request, res: Response) => {
    try {
      const { name, address, upiId, gstNumber, ownerId, category, landmark, businessType, aadharPanUrl, storefrontUrl } = req.body;
      
      const store = await prisma.store.create({
        data: {
          name,
          address,
          upiId,
          gstNumber,
          category,
          landmark,
          businessType,
          aadharPanUrl,
          storefrontUrl,
          status: 'PENDING',
          users: {
            create: {
              userId: ownerId
            }
          }
        }
      });

      // DO NOT update user role to STORE_PARTNER here. It happens upon verification.
      // We just emit a socket event for the admin.
      try {
        const { getIO } = require('../socket');
        getIO().emit('store_pending', store);
      } catch (e) {
        console.error('Socket emit failed', e);
      }

      res.status(201).json({ store });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get details of a specific store
  getStore = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { products: true }
      });

      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.status(200).json({ ...store, isCurrentlyOpen: checkStoreOpenStatus(store) });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get store by owner userId
  getMyStore = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId },
        include: { store: { include: { products: true } } }
      });

      if (!storeUser || !storeUser.store) {
        return res.status(404).json({ error: 'Store not found for this user' });
      }

      res.status(200).json({ ...storeUser.store, isCurrentlyOpen: checkStoreOpenStatus(storeUser.store) });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all verified stores
  getAllStores = async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.query;

      let stores = await prisma.store.findMany({
        where: { 
          status: 'VERIFIED',
          isActive: true
        },
        select: {
          id: true,
          name: true,
          address: true,
          title: true,
          description: true,
          bannerUrl: true,
          logoUrl: true,
          openingTime: true,
          closingTime: true,
          latitude: true,
          longitude: true,
          themeColor: true,
          secondaryColor: true,
          minimumOrder: true,
          acceptedPayments: true,
          workingDays: true,
        }
      });

      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);

        if (!isNaN(userLat) && !isNaN(userLng)) {
          const storesWithDist = stores.map(store => {
            if (store.latitude && store.longitude) {
              const distance = calculateHaversineDistance(userLat, userLng, store.latitude, store.longitude);
              return { ...store, distance, isCurrentlyOpen: checkStoreOpenStatus(store) };
            }
            return { ...store, distance: Infinity, isCurrentlyOpen: checkStoreOpenStatus(store) };
          });
          storesWithDist.sort((a, b) => a.distance - b.distance);
          return res.status(200).json(storesWithDist);
        }
      }

      const storesWithStatus = stores.map(store => ({ ...store, isCurrentlyOpen: checkStoreOpenStatus(store) }));
      res.status(200).json(storesWithStatus);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all pending stores for admin
  getPendingStores = async (req: Request, res: Response) => {
    try {
      const stores = await prisma.store.findMany({
        where: { status: 'PENDING' },
        include: { users: { include: { user: true } } }
      });
      res.status(200).json(stores);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Verify a store (Admin action)
  verifyStore = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      
      const store = await prisma.store.update({
        where: { id: storeId },
        data: { status: 'VERIFIED' },
        include: { users: true }
      });

      // Update role of all store owners
      for (const storeUser of store.users) {
        await prisma.user.update({
          where: { id: storeUser.userId },
          data: { role: 'STORE_PARTNER' }
        });
      }

      res.status(200).json({ message: 'Store verified successfully', store });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Update store profile settings
  updateStoreProfile = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const {
        title,
        description,
        isActive,
        openingTime,
        closingTime,
        bannerUrl,
        logoUrl,
        themeColor,
        secondaryColor,
        workingDays,
        minimumOrder,
        acceptedPayments,
        latitude,
        longitude,
        address
      } = req.body;

      const store = await prisma.store.update({
        where: { id: storeId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
          ...(openingTime !== undefined && { openingTime }),
          ...(closingTime !== undefined && { closingTime }),
          ...(bannerUrl !== undefined && { bannerUrl }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(themeColor !== undefined && { themeColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(workingDays !== undefined && { workingDays }),
          ...(minimumOrder !== undefined && { minimumOrder }),
          ...(acceptedPayments !== undefined && { acceptedPayments }),
          ...(latitude !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
          ...(address !== undefined && { address }),
        }
      });

      res.status(200).json({ message: 'Store profile updated successfully', store });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
