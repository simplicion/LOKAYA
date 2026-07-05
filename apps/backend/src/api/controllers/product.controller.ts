import { Request, Response } from 'express';
import { prisma } from '@workspace/db';
import crypto from 'crypto';

export class ProductController {
  
  // Add a single product to a store
  addProduct = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const { name, brand, category, mrp, sellingPrice, stockCount, imageUrl, sku } = req.body;
      
      const qrUuid = crypto.randomUUID();

      const product = await prisma.product.create({
        data: {
          storeId,
          name,
          brand,
          category,
          mrp,
          sellingPrice,
          stockCount,
          imageUrl,
          sku,
          qrUuid
        }
      });

      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get products for a store
  getProducts = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      
      const products = await prisma.product.findMany({
        where: { storeId }
      });

      res.status(200).json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Resolve product by QR
  resolveQr = async (req: Request, res: Response) => {
    try {
      const { qrUuid } = req.params;
      
      const product = await prisma.product.findUnique({
        where: { qrUuid },
        include: { store: true }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found from this QR' });
      }

      res.status(200).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
