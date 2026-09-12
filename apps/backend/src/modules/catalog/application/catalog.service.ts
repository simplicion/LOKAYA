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
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : 1,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
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

    // Auto-generate SKU if not provided
    const sku = data.sku && typeof data.sku === 'string' && data.sku.trim().length > 0
      ? data.sku.trim()
      : `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Resolve category and categoryId
    let categoryId = data.categoryId || null;
    let categoryName = data.category || null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (categoryName && uuidRegex.test(categoryName) && !categoryId) {
      categoryId = categoryName;
      const catRecord = await prisma.category.findUnique({ where: { id: categoryId } });
      if (catRecord) {
        categoryName = catRecord.name;
      }
    } else if (categoryId && !categoryName) {
      const catRecord = await prisma.category.findUnique({ where: { id: categoryId } });
      if (catRecord) {
        categoryName = catRecord.name;
      }
    }

    // Determine primary image URL from media if not explicitly set
    const primaryMedia = data.media?.find((m: any) => m.isPrimary) || data.media?.[0];
    const imageUrl = data.imageUrl || primaryMedia?.url || null;

    const productData = {
      storeId: data.storeId,
      name: data.name,
      brand: data.brand || null,
      description: data.description || null,
      category: categoryName,
      categoryId: categoryId,
      sku: sku,
      mrp: data.mrp !== undefined && data.mrp !== null ? Number(data.mrp) : 0,
      sellingPrice: data.sellingPrice !== undefined && data.sellingPrice !== null ? Number(data.sellingPrice) : 0,
      stockCount: data.stockCount !== undefined && data.stockCount !== null ? Number(data.stockCount) : 0,
      imageUrl: imageUrl,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      qrUuid,
      // V2 fields
      productType: data.productType || 'PHYSICAL',
      status: data.status || 'PUBLISHED',
      hasVariants: Boolean(data.hasVariants),
      isAvailableForDelivery: data.isAvailableForDelivery ?? true,
      isAvailableForPickup: data.isAvailableForPickup ?? true,
      processingTime: data.processingTime || null
    };

    const product = await prisma.product.create({
      data: productData
    });

    // Handle media if provided
    if (data.media && data.media.length > 0) {
      await prisma.productMedia.createMany({
        data: data.media.map((m: any, idx: number) => ({
          productId: product.id,
          url: m.url,
          type: m.type || 'IMAGE',
          isPrimary: m.isPrimary !== undefined ? Boolean(m.isPrimary) : idx === 0,
          displayOrder: m.displayOrder !== undefined ? Number(m.displayOrder) : idx
        }))
      });
    }

    // Handle variants if provided
    if (data.variants && data.variants.length > 0) {
      for (const [idx, v] of data.variants.entries()) {
        const variantSku = v.sku && typeof v.sku === 'string' && v.sku.trim().length > 0
          ? v.sku.trim()
          : `${sku}-VAR-${idx + 1}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            sku: variantSku,
            price: Number(v.price) || 0,
            stockCount: Number(v.stockCount) || 0,
            status: 'ACTIVE'
          }
        });
        
        await prisma.inventory.create({
          data: {
            variantId: variant.id,
            available: Number(v.stockCount) || 0,
            reserved: 0,
            threshold: 5
          }
        });
      }
    }

    return await prisma.product.findUnique({
      where: { id: product.id },
      include: { variants: true, media: true, categoryModel: true }
    });
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const { variants, media, ...updateData } = data;

    // Update core product details
    await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Handle media update (delete all old, insert new)
    if (media) {
      await prisma.productMedia.deleteMany({ where: { productId: id } });
      if (media.length > 0) {
        await prisma.productMedia.createMany({
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
      const existingVariants = await prisma.productVariant.findMany({ where: { productId: id } });
      const existingVariantIds = existingVariants.map((v) => v.id);
      const newVariantIds = variants.map((v: any) => v.id).filter(Boolean);

      // Delete variants that are no longer in the list
      const variantsToDelete = existingVariantIds.filter(id => !newVariantIds.includes(id));
      if (variantsToDelete.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: variantsToDelete } }
        });
      }

      // Upsert variants
      for (const v of variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              sku: v.sku,
              price: v.price,
              stockCount: v.stockCount,
              status: v.status || 'ACTIVE'
            }
          });
        } else {
          const newVariant = await prisma.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              stockCount: v.stockCount,
              status: 'ACTIVE'
            }
          });

          await prisma.inventory.create({
            data: {
              variantId: newVariant.id,
              available: v.stockCount,
              reserved: 0,
              threshold: 5
            }
          });
        }
      }
    }

    return await prisma.product.findUnique({
      where: { id },
      include: { variants: true, media: true }
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

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        variants: true,
        media: {
          orderBy: { displayOrder: 'asc' }
        },
        categoryModel: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        orderItems: {
          take: 10,
          orderBy: { id: 'desc' },
          include: {
            order: {
              select: { id: true, createdAt: true, buyer: { select: { name: true } } }
            }
          }
        }
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError('Product not found', 404);

    // Soft delete
    return await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        status: 'ARCHIVED'
      }
    });
  }

  static async getAllProducts(query?: { category?: string; search?: string; sort?: string; limit?: number }) {
    const where: any = {
      isActive: true,
      status: { not: 'ARCHIVED' }
    };

    if (query?.category && query.category !== 'all') {
      where.OR = [
        { category: { contains: query.category, mode: 'insensitive' } },
        { categoryModel: { name: { contains: query.category, mode: 'insensitive' } } }
      ];
    }

    if (query?.search && query.search.trim().length > 0) {
      const searchTerms = query.search.trim();
      where.OR = [
        { name: { contains: searchTerms, mode: 'insensitive' } },
        { description: { contains: searchTerms, mode: 'insensitive' } },
        { brand: { contains: searchTerms, mode: 'insensitive' } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query?.sort === 'price_asc') orderBy = { sellingPrice: 'asc' };
    if (query?.sort === 'price_desc') orderBy = { sellingPrice: 'desc' };

    const products = await prisma.product.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            status: true,
            logoUrl: true
          }
        },
        media: {
          orderBy: { displayOrder: 'asc' }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy,
      take: query?.limit ? Number(query.limit) : 50
    });

    return products.map((prod: any) => {
      const avgRating = prod.reviews?.length > 0
        ? prod.reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / prod.reviews.length
        : 0;

      const primaryImage = prod.media?.[0]?.url || prod.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
      const price = prod.sellingPrice ?? 0;
      const mrp = prod.mrp && prod.mrp > price ? prod.mrp : undefined;
      const discountLabel = mrp ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined;

      return {
        id: prod.id,
        title: prod.name,
        name: prod.name,
        description: prod.description,
        image: primaryImage,
        primaryImage,
        images: prod.media?.map((m: any) => m.url) || (prod.imageUrl ? [prod.imageUrl] : []),
        price: price.toLocaleString('en-IN'),
        sellingPrice: price,
        originalPrice: mrp ? mrp.toLocaleString('en-IN') : undefined,
        mrp: mrp,
        discount: discountLabel,
        discountLabel: discountLabel,
        store: {
          id: prod.store?.id || '',
          name: prod.store?.name || 'Lokaya Store',
          isVerified: prod.store?.status === 'VERIFIED',
          logoUrl: prod.store?.logoUrl
        },
        rating: avgRating > 0 ? avgRating.toFixed(1) : '4.8',
        reviews: `(${prod.reviews?.length || 0})`,
        reviewsCount: prod.reviews?.length || 0,
        category: prod.category
      };
    });
  }
}


