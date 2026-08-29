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
              select: { id: true, name: true, imageUrl: true, sellingPrice: true, storeId: true }
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
                select: { id: true, name: true, imageUrl: true, sellingPrice: true, storeId: true }
              },
              variant: true
            }
          }
        }
      });
    }

    return cart;
  }

  static async addItemToCart(userId: string, productId: string, variantId?: string, quantity: number = 1) {
    const cart = await this.getCart(userId);
    
    // Verify product exists and is active
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new AppError('Product is not available', 400);
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find((item: any) => 
      item.productId === productId && item.variantId === (variantId || null)
    );

    if (existingItem) {
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true } },
          variant: true
        }
      });
    }

    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity
      },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true } },
        variant: true
      }
    });
  }

  static async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) {
      throw new AppError('Cart item not found', 404);
    }

    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, sellingPrice: true } },
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
      throw new AppError(`Cart minimum value must be ₹${coupon.minCartValue}`, 400);
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
