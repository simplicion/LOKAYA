import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { getSharedConfig } from '../shared/config';
import authRoutes from './routes/auth.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import { initSocket } from './socket';

export function startApiServer() {
  const app = express();
  const httpServer = createServer(app);
  const port = process.env.PORT || 4000;

  // Init socket.io
  initSocket(httpServer);

  app.use(cors());
  app.use(express.json());

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/stores', storeRoutes);
  app.use('/api/v1', productRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/uploads', uploadRoutes);

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
