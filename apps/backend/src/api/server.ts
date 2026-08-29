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
import { sellerRouter as sellerRoutes } from '../modules/seller/interfaces/seller.routes';
import { mediaRouter } from '../modules/media/presentation/media.routes';
import searchRoutes from '../modules/search/interfaces/search.routes';
import { wishlistRoutes } from '../modules/wishlist/interfaces/wishlist.routes';
import { initSocket } from './socket';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middleware/errorHandler';

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

  // Allow credentials for cookies
  app.use(cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

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
  app.use('/api/v1/seller', sellerRoutes);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/wishlist', wishlistRoutes);

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'api-server', 
      config: getSharedConfig() 
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  httpServer.listen(port, () => {
    console.log(`[API] Server is running on port ${port}`);
  });
}

// trigger nodemon restart
