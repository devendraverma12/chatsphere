import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { initSocket } from './sockets/chatSocket.js';
import { seedMockData } from './services/dbService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load env
dotenv.config();

// Connect database
connectDB();

const app = express();
const server = http.createServer(app);

// Bind Socket.io
const io = new Server(server, {
  pingTimeout: 60000, // Timeout sockets after 60s inactivity
  cors: {
    origin: '*', // Allow all origins for dev flexibility
    credentials: true,
  },
});

// Initialize socket listeners
initSocket(io);

// Express config middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Register REST endpoints
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    databaseMode: global.useMockDB ? 'Local JSON Fallback' : 'MongoDB Live Mode',
    message: 'ChatSphere backend server is running smoothly',
  });
});

// Pre-seed default bots and John Doe if running in mock database mode
// We run this directly on startup
const seedInitialData = async () => {
  try {
    await seedMockData();
  } catch (error) {
    console.error('Seeding mock data failed:', error);
  }
};
seedInitialData();

// Serve client assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('ChatSphere API Server is running. Launch client dev server.');
  });
}

// Global Express error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 250 ? 500 : res.statusCode;
  console.error('Error stack:', err.stack || err.message || err);
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`DB Fallback mode is: ${global.useMockDB ? 'Mock JSON File-Store' : 'Live MongoDB connection'}`);
});
