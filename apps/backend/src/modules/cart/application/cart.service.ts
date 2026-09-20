import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class CartService {
  
  static async getCart(userId: string) {
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                imageUrl: true, 
                sellingPrice: true, 
                storeId: true, 
                stockCount: true, 
                isActive: true,
                store: {
                  select: { id: true, name: true, address: true, city: true, state: true }
                }
              }
            },
            variant: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { 
                  id: true, 
                  name: true, 
                  imageUrl: true, 
                  sellingPrice: true, 
                  storeId: true, 
                  stockCount: true, 
                  isActive: true,
                  store: {
                    select: { id: true, name: true, address: true, city: true, state: true }
                  }
                }
              },
              variant: true
            }
          }
        }
      });
    } else if (cart.items.length > 0) {
      // Automatically purge any orphaned cart items where the product was deleted from DB or is inactive
      const orphanItemIds = cart.items
        .filter((item: any) => !item.product || !item.product.isActive)
        .map((item: any) => item.id);

      if (orphanItemIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { id: { in: orphanItemIds } }
        });
        cart.items = cart.items.filter((item: any) => !orphanItemIds.includes(item.id));
      }
    }

    return cart;
  }

  static async addItemToCart(userId: string, productId: string, variantId?: string, quantity: number = 1) {
    const cart = await this.getCart(userId);
    
    // Verify product exists and is active
    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      include: { variants: true }
    });
    if (!product || !product.isActive) {
      throw new AppError('Product is not available', 400);
    }

    // Check variant or product stock
    let availableStock = product.stockCount ?? 0;
    if (variantId) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (!variant) {
        throw new AppError('Selected product variant not found', 404);
      }
      availableStock = variant.stockCount ?? 0;
    }

    if (availableStock <= 0) {
      throw new AppError(`"${product.name}" is currently out of stock`, 400);
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find((item: any) => 
      item.productId === productId && item.variantId === (variantId || null)
    );

    if (existingItem) {
      const requestedTotal = existingItem.quantity + quantity;
      if (requestedTotal > availableStock) {
        throw new AppError(
          `Cannot add more. Only ${availableStock} units available in stock (${existingItem.quantity} already in bag)`,
          400
        );
      }

      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedTotal },
        include: {
          product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true, stockCount: true } },
          variant: true
        }
      });
    }

    if (quantity > availableStock) {
      throw new AppError(`Cannot add ${quantity} units. Only ${availableStock} units available in stock`, 400);
    }

    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity
      },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true, stockCount: true } },
        variant: true
      }
    });
  }

  static async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await prisma.cartItem.findUnique({ 
      where: { id: itemId },
      include: { product: true, variant: true }
    });
    if (!item || item.cartId !== cart.id) {
      throw new AppError('Cart item not found', 404);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return { success: true, removed: true };
    }

    const availableStock = item.variant ? (item.variant.stockCount ?? 0) : (item.product.stockCount ?? 0);
    if (quantity > availableStock) {
      throw new AppError(`Cannot update quantity. Only ${availableStock} units available in stock`, 400);
    }

    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true, stockCount: true } },
        variant: true
      }
    });
  }

  static async removeItemFromCart(userId: string, itemId: string) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
    
    // Also remove coupon if cart is cleared
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null }
    });

    return { success: true, message: 'Cart cleared' };
  }

  static async applyCoupon(userId: string, code: string) {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon || !coupon.isActive) {
      throw new AppError('Invalid or expired coupon', 400);
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new AppError('Coupon has expired', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400);
    }

    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

    if (coupon.minCartValue && subtotal < coupon.minCartValue) {
      throw new AppError(`Cart minimum value must be ${coupon.minCartValue}`, 400);
    }

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
      include: {
        coupon: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true, storeId: true }
            },
            variant: true
          }
        }
      }
    });

    return updatedCart;
  }

  static async removeCoupon(userId: string) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    return await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
      include: {
        coupon: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true, storeId: true }
            },
            variant: true
          }
        }
      }
    });
  }
}
