import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import crypto from 'crypto';

export class CatalogService {
  
  // ==========================================
  // Category Management
  // ==========================================

  static async createCategory(data: any) {
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await prisma.category.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder,
        isActive: data.isActive
      }
    });
  }

  static async updateCategory(id: string, data: any) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return await prisma.category.update({
      where: { id },
      data
    });
  }

  static async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if products exist in category
    const productsUsingCategory = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsUsingCategory > 0) {
      throw new AppError('Cannot delete category because it contains products', 400);
    }

    await prisma.category.delete({ where: { id } });
    return { success: true };
  }

  static async getCategoriesByStore(storeId: string) {
    return await prisma.category.findMany({
      where: { storeId },
      orderBy: { displayOrder: 'asc' }
    });
  }

  // ==========================================
  // Product Management
  // ==========================================

  static async createProduct(data: any) {
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    // Generate a unique QR UUID for the product
    const qrUuid = crypto.randomUUID();

    const productData = {
      storeId: data.storeId,
      name: data.name,
      brand: data.brand,
      description: data.description,
      category: data.category,
      categoryId: data.categoryId,
      sku: data.sku,
      mrp: data.mrp || 0,
      sellingPrice: data.sellingPrice || 0,
      stockCount: data.stockCount || 0,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      qrUuid,
      // V2 fields
      productType: data.productType || 'PHYSICAL',
      status: data.status || 'DRAFT',
      hasVariants: data.hasVariants || false,
      isAvailableForDelivery: data.isAvailableForDelivery ?? true,
      isAvailableForPickup: data.isAvailableForPickup ?? true,
      processingTime: data.processingTime
    };

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData
      });

      // Handle media if provided
      if (data.media && data.media.length > 0) {
        await tx.productMedia.createMany({
          data: data.media.map((m: any) => ({
            productId: product.id,
            url: m.url,
            type: m.type,
            isPrimary: m.isPrimary,
            displayOrder: m.displayOrder
          }))
        });
      }

      // Handle variants if provided
      if (data.variants && data.variants.length > 0) {
        // Create variants
        for (const v of data.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              stockCount: v.stockCount,
              status: 'ACTIVE'
            }
          });
          
          // Also create initial inventory for each variant
          await tx.inventory.create({
            data: {
              variantId: variant.id,
              available: v.stockCount,
              reserved: 0,
              threshold: 5
            }
          });
        }
      }

      return await tx.product.findUnique({
        where: { id: product.id },
        include: { variants: true, media: true }
      });
    });
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const { variants, media, ...updateData } = data;

    return await prisma.$transaction(async (tx) => {
      // Update core product details
      await tx.product.update({
        where: { id },
        data: updateData
      });

      // Handle media update (delete all old, insert new)
      if (media) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        if (media.length > 0) {
          await tx.productMedia.createMany({
            data: media.map((m: any) => ({
              productId: id,
              url: m.url,
              type: m.type,
              isPrimary: m.isPrimary,
              displayOrder: m.displayOrder
            }))
          });
        }
      }

      // Handle variants update (upsert)
      if (variants) {
        const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
        const existingVariantIds = existingVariants.map((v) => v.id);
        const newVariantIds = variants.map((v: any) => v.id).filter(Boolean);

        // Delete variants that are no longer in the list
        const variantsToDelete = existingVariantIds.filter(id => !newVariantIds.includes(id));
        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: variantsToDelete } }
          });
        }

        // Upsert variants
        for (const variant of variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stockCount: variant.stockCount
              }
            });
          } else {
            const newVar = await tx.productVariant.create({
              data: {
                productId: id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stockCount: variant.stockCount,
                status: 'ACTIVE'
              }
            });
            await tx.inventory.create({
              data: {
                variantId: newVar.id,
                available: variant.stockCount,
                reserved: 0,
                threshold: 5
              }
            });
          }
        }
      }

      return await tx.product.findUnique({
        where: { id },
        include: { variants: true, media: true }
      });
    });
  }

  static async getProductsByStore(storeId: string) {
    return await prisma.product.findMany({
      where: { storeId },
      include: { variants: true, media: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getProductByQr(qrUuid: string) {
    const product = await prisma.product.findUnique({
      where: { qrUuid },
      include: { 
        variants: true,
        media: true,
        store: {
          select: {
            id: true,
            name: true,
            handle: true,
            storefrontUrl: true,
            logoUrl: true
          }
        }
      }
    });

    if (!product) {
      throw new AppError('Product not found from this QR', 404);
    }

    return product;
  }
}
