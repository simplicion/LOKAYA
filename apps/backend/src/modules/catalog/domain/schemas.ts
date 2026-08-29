import { z } from 'zod';

export const variantSchema = z.object({
  id: z.string().optional(), // For updates
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.number().min(0, 'Variant price cannot be negative'),
  stockCount: z.number().int().min(0, 'Variant stock cannot be negative').default(0)
});

export const createProductSchema = z.object({
  body: z.object({
    storeId: z.string().uuid('Invalid store ID'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    brand: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    mrp: z.number().min(0, 'MRP cannot be negative').optional(),
    sellingPrice: z.number().min(0, 'Selling price cannot be negative').optional(),
    stockCount: z.number().int().min(0, 'Stock cannot be negative').optional(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    isActive: z.boolean().optional().default(true),
    
    // V2 Fields
    productType: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED']).optional(),
    hasVariants: z.boolean().optional(),
    isAvailableForDelivery: z.boolean().optional(),
    isAvailableForPickup: z.boolean().optional(),
    processingTime: z.string().optional(),

    variants: z.array(variantSchema).optional(),
    media: z.array(z.object({
      url: z.string().url(),
      type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0)
    })).optional()
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID')
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    brand: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    sku: z.string().min(3, 'SKU must be at least 3 characters').optional(),
    mrp: z.number().min(0, 'MRP cannot be negative').optional(),
    sellingPrice: z.number().min(0, 'Selling price cannot be negative').optional(),
    stockCount: z.number().int().min(0, 'Stock cannot be negative').optional(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    isActive: z.boolean().optional(),

    // V2 Fields
    productType: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED']).optional(),
    hasVariants: z.boolean().optional(),
    isAvailableForDelivery: z.boolean().optional(),
    isAvailableForPickup: z.boolean().optional(),
    processingTime: z.string().optional(),

    variants: z.array(variantSchema).optional(),
    media: z.array(z.object({
      url: z.string().url(),
      type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0)
    })).optional()
  })
});

export const createCategorySchema = z.object({
  body: z.object({
    storeId: z.string().uuid('Invalid store ID'),
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    displayOrder: z.number().int().default(1),
    isActive: z.boolean().default(true)
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID')
  }),
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').optional(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    displayOrder: z.number().int().optional(),
    isActive: z.boolean().optional()
  })
});
