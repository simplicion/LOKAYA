import { z } from 'zod';

export const variantSchema = z.object({
  id: z.string().optional(), // For updates
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Variant price cannot be negative'),
  stockCount: z.coerce.number().int().min(0, 'Variant stock cannot be negative').default(0)
});

export const createProductSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store ID').optional(),
  }).optional(),
  body: z.object({
    storeId: z.string().uuid('Invalid store ID').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    brand: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    sku: z.string().optional().nullable(),
    mrp: z.coerce.number().min(0, 'MRP cannot be negative').optional().nullable(),
    sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
    stockCount: z.coerce.number().int().min(0, 'Stock cannot be negative').optional().nullable(),
    imageUrl: z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional().nullable(),
    isActive: z.boolean().optional().default(true),
    
    // V2 Fields
    productType: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED']).optional(),
    hasVariants: z.boolean().optional(),
    isAvailableForDelivery: z.boolean().optional(),
    isAvailableForPickup: z.boolean().optional(),
    processingTime: z.string().optional().nullable(),

    variants: z.array(variantSchema).optional(),
    media: z.array(z.object({
      url: z.union([z.string().url(), z.string().startsWith('/'), z.string().min(1)]),
      type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0)
    })).optional()
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID').optional(),
    productId: z.string().uuid('Invalid product ID').optional()
  }).optional(),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    brand: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    mrp: z.coerce.number().min(0, 'MRP cannot be negative').optional().nullable(),
    sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
    stockCount: z.coerce.number().int().min(0, 'Stock cannot be negative').optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isActive: z.boolean().optional(),

    // V2 Fields
    productType: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED']).optional(),
    hasVariants: z.boolean().optional(),
    isAvailableForDelivery: z.boolean().optional(),
    isAvailableForPickup: z.boolean().optional(),
    processingTime: z.string().optional().nullable(),

    variants: z.array(variantSchema).optional(),
    media: z.array(z.object({
      url: z.union([z.string().url(), z.string().startsWith('/'), z.string().min(1)]),
      type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0)
    })).optional()
  })
});

export const createCategorySchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store ID').optional(),
  }).optional(),
  body: z.object({
    storeId: z.string().uuid('Invalid store ID').optional(),
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional().nullable(),
    imageUrl: z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional().nullable(),
    displayOrder: z.coerce.number().int().optional().default(1),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional()
  }).optional(),
  body: z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    description: z.string().optional().nullable(),
    imageUrl: z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional().nullable(),
    displayOrder: z.coerce.number().int().optional(),
    isActive: z.boolean().optional()
  })
});
