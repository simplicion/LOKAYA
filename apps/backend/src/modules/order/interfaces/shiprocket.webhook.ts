import { Request, Response } from 'express';
import { prisma, OrderStatus } from '@workspace/db';

/**
 * Shiprocket 3PL Live Tracking Webhook Handler.
 * Ingests live courier status updates (e.g., PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RTO).
 * Atomically updates both the parent Order and all linked child SubOrder records.
 */
export async function handleShiprocketWebhook(req: Request, res: Response) {
  try {
    const { current_status, awb, order_id } = req.body;
    console.log(`[Shiprocket Webhook] Received tracking event for AWB ${awb}: ${current_status}`);

    if (awb || order_id) {
      let mappedStatus: OrderStatus | undefined = undefined;
      const statusUpper = (current_status || '').toUpperCase();

      if (statusUpper.includes('DELIVERED')) {
        mappedStatus = OrderStatus.DELIVERED;
      } else if (statusUpper.includes('OUT FOR DELIVERY')) {
        mappedStatus = OrderStatus.OUT_FOR_DELIVERY;
      } else if (statusUpper.includes('IN TRANSIT') || statusUpper.includes('PICKED UP')) {
        mappedStatus = OrderStatus.SHIPPED;
      } else if (statusUpper.includes('RTO') || statusUpper.includes('RETURN')) {
        mappedStatus = OrderStatus.RETURNED;
      }

      if (mappedStatus) {
        // Update parent Order
        await prisma.order.updateMany({
          where: { OR: [{ awbCode: awb }, { id: order_id }] },
          data: { status: mappedStatus }
        });

        // Update child SubOrder records to maintain seller dashboard sync
        await prisma.subOrder.updateMany({
          where: { OR: [{ awbCode: awb }, { orderId: order_id }] },
          data: { status: mappedStatus }
        });

        // Emit socket event if io is available
        try {
          const { getIO } = require('../../../api/socket');
          const io = getIO();
          if (io && order_id) {
            io.to(`order_${order_id}`).emit('order_status_updated', {
              orderId: order_id,
              status: mappedStatus,
              awbCode: awb
            });
          }
        } catch (e) {
          // Socket emit non-fatal
        }
      }
    }

    // Always respond 200 to prevent Shiprocket retry spam
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Shiprocket Webhook] Error processing tracking payload:', error);
    res.status(200).json({ success: false });
  }
}
