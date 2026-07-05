import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.patch('/:orderId/status', orderController.updateOrderStatus);

export default router;
