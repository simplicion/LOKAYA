import { Request, Response } from 'express';
import { prisma } from '@workspace/db';

export class StoreController {
  
  // Register a new store (Onboarding)
  onboardStore = async (req: Request, res: Response) => {
    try {
      const { name, address, upiId, gstNumber, ownerId } = req.body;
      
      const store = await prisma.store.create({
        data: {
          name,
          address,
          upiId,
          gstNumber,
          users: {
            create: {
              userId: ownerId
            }
          }
        }
      });

      try {
        const { getIO } = require('../socket');
        getIO().emit('store_pending', store);
      } catch (e) {
        console.error('Socket emit failed', e);
      }

      res.status(201).json(store);
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

      res.status(200).json(store);
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

      res.status(200).json(storeUser.store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all verified stores
  getAllStores = async (req: Request, res: Response) => {
    try {
      const stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          address: true,

        }
      });
      res.status(200).json(stores);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
