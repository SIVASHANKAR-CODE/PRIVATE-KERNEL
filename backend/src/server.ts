import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { connectDB } from './services/db.js';
import apiRoutes from './routes/index.js';
import { setupChatSockets } from './sockets/chatSocket.js';

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure upload directory exists and serve static uploads
if (!fs.existsSync(config.storage.localPath)) {
  fs.mkdirSync(config.storage.localPath, { recursive: true });
}
app.use('/api/uploads', express.static(config.storage.localPath));

// API Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' }
  }
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRoutes);

// Setup Socket.IO
setupChatSockets(io);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'An unexpected error occurred' }
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`  PRIVATE KERNEL Backend running on port ${config.port}`);
      console.log(`  REST API:   http://localhost:${config.port}/api`);
      console.log(`  Socket.IO:  Ready for authenticated connections`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
