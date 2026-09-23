import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // For dev, allow all
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Clients can join specific rooms
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`[Socket] Client ${socket.id} joined room: order_${orderId}`);
    });

    socket.on('join_store', (storeId) => {
      socket.join(`store_${storeId}`);
      console.log(`[Socket] Client ${socket.id} joined room: store_${storeId}`);
    });

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`[Socket] Client ${socket.id} joined room: user_${userId}`);
    });

    socket.on('join_rider', (riderUserId) => {
      socket.join(`rider_${riderUserId}`);
      console.log(`[Socket] Client ${socket.id} joined room: rider_${riderUserId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
