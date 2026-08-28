import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { getSharedConfig } from '../shared/config';
import { authRouter as identityRoutes } from '../modules/identity/interfaces/auth.routes';
import { catalogRoutes } from '../modules/catalog/interfaces/catalog.routes';
import { inventoryRoutes } from '../modules/inventory/interfaces/inventory.routes';
import { contentRoutes } from '../modules/content/interfaces/content.routes';
import { socialRoutes } from '../modules/social/interfaces/social.routes';
import { cartRoutes } from '../modules/cart/interfaces/cart.routes';
import { orderRoutes } from '../modules/order/interfaces/order.routes';
import { paymentRoutes } from '../modules/payment/interfaces/payment.routes';
import { initSocket } from './socket';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

export function startApiServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = process.env.PORT || 4002;

  // Security Headers
  app.use(helmet());

  // Init socket.io
  initSocket(httpServer);

  app.use(cors());
  app.use(express.json());

  // Rate Limiting (apply to all API routes)
  app.use('/api', apiLimiter);

  // Mount new modular routes
  app.use('/api/v1/identity', identityRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/inventory', inventoryRoutes);
  app.use('/api/v1/content', contentRoutes);
  app.use('/api/v1/social', socialRoutes);
  app.use('/api/v1/cart', cartRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/payments', paymentRoutes);

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'api-server', 
      config: getSharedConfig() 
    });
  });

  httpServer.listen(port, () => {
    console.log(`[API] Server is running on port ${port}`);
  });
}
