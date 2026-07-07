const { Server } = require('socket.io');
const { setIo } = require('../services/notificationService');

let io;

const initSocket = (server) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Share io instance with notification service
  setIo(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a specific auction room
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} joined room: auction_${auctionId}`);
    });

    // Leave a specific auction room
    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} left room: auction_${auctionId}`);
    });

    // Join user's personal room for direct notifications
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room: user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIo,
};
