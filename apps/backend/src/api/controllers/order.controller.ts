import { Request, Response } from 'express';
import { prisma } from '@workspace/db';
import { Queue } from 'bullmq';

const orderQueue = new Queue('process-order', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export class OrderController {
  
  createOrder = async (req: Request, res: Response) => {
    try {
      const { userId, storeId, items, totalAmount } = req.body;

      // 1. Create order in DB
      const order = await prisma.order.create({
        data: {
          totalAmount,
          status: 'PENDING',
          buyer: {
            connect: { id: userId }
          },
          store: {
            connect: { id: storeId }
          },
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.price
            }))
          }
        },
        include: {
          items: true,
          store: true,
        }
      });

      // 2. Queue job for async processing
      await orderQueue.add('process-order-job', {
        orderId: order.id,
      });

      res.status(201).json(order);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true }
          },
          store: true
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.status(200).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      try {
        const { getIO } = require('../socket');
        // Emit to a specific room for this order
        getIO().to(`order_${orderId}`).emit('order_status_updated', order);
      } catch (e) {
        console.error('Socket emit failed', e);
      }

      res.status(200).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
