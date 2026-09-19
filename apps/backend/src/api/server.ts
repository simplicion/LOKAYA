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
import { adminRouter } from '../modules/admin/interfaces/admin.routes';
import { supportRoutes } from '../modules/support/interfaces/support.routes';
import { metaRoutes } from '../modules/common/meta.routes';
import { initSocket } from './socket';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middleware/errorHandler';

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100000 : 3000, // Generous limit in prod, bypassed in dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isDev) return true;
    const url = req.originalUrl || req.url || '';
    return url.includes('/media') || url.includes('/health');
  },
  handler: (req, res) => {
    console.warn(`[RateLimit 429] IP ${req.ip} exceeded rate limit on ${req.method} ${req.originalUrl}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      statusCode: 429
    });
  }
});

export function startApiServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = process.env.PORT || 4101;

  // Security Headers (allow cross-origin resources for media streaming/images)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));

  // Init socket.io
  initSocket(httpServer);

  // Allow credentials for cookies
  const configuredOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [];
  const defaultOrigins = [
    'http://localhost:3101',
    'http://localhost:3102',
    'http://localhost:3103',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  const allAllowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allAllowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Mount media routes first (completely exempt from API rate limiting)
  app.use('/api/v1/media', mediaRouter);

  // Rate Limiting (apply to remaining API routes)
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
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/wishlist', wishlistRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/meta', metaRoutes);

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
