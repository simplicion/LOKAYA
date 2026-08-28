import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class InventoryService {
  
  /**
   * Adjust stock for a product or product variant.
   * Ensures atomic updates and logs the adjustment.
   */
  static async adjustStock(data: { productId: string, variantId?: string | null, change: number, reason: string }) {
    const { productId, variantId, change, reason } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Verify product exists
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      let updatedStockCount = 0;

      // 2. Adjust Stock
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId }
        });

        if (!variant) {
          throw new AppError('Variant not found', 404);
        }
        if (variant.productId !== productId) {
          throw new AppError('Variant does not belong to this product', 400);
        }

        const updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockCount: {
              increment: change
            }
          }
        });
        
        if (updatedVariant.stockCount < 0) {
           throw new AppError('Insufficient variant stock for this operation', 400);
        }
        
        updatedStockCount = updatedVariant.stockCount;
      } else {
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockCount: {
              increment: change
            }
          }
        });
        
        if (updatedProduct.stockCount < 0) {
           throw new AppError('Insufficient product stock for this operation', 400);
        }
        
        updatedStockCount = updatedProduct.stockCount;
      }

      // 3. Log the adjustment
      const log = await tx.inventoryLog.create({
        data: {
          productId,
          change,
          reason
        }
      });

      return {
        success: true,
        productId,
        variantId,
        newStockCount: updatedStockCount,
        logId: log.id
      };
    });
  }
}
