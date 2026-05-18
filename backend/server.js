const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
dotenv.config();

const app = express();
const server = http.createServer(app);

// ===== CORS =====
const allowedOrigins = [
  'https://radiotelemegastar.netlify.app',
  'https://radio-tele-megastar.pages.dev',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== RATE LIMITING SENP (san Redis) =====
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minit
  const maxRequests = 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = requestCounts.get(ip);
    if (now > data.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      data.count++;
      if (data.count > maxRequests) {
        return res.status(429).json({ success: false, message: 'Twòp demand — eseye nan yon minit' });
      }
    }
  }
  next();
});

// ===== SOCKET.IO =====
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

// Pase io nan tout routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

let onlineUsers = 0;

io.on('connection', (socket) => {
  console.log('User conecte');
  onlineUsers++;
  io.emit('onlineCount', onlineUsers);

  socket.on('disconnect', () => {
    console.log('User dekonekte');
    onlineUsers--;
    io.emit('onlineCount', onlineUsers);
  });
});

// ===== MONGODB =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB konekte!'))
  .catch(err => console.error('MongoDB ere:', err.message));

// ===== ROUTES =====
const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/User');
const adminRoutes   = require('./routes/admin');
const mistralRoutes = require('./routes/mistral');

app.use('/api/auth',    authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/mistral', mistralRoutes);

// ===== ROUTE DEFO =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Radio Tele Mega Star API — En ligne!',
    version: '3.0',
    routes: ['/api/auth', '/api/user', '/api/admin', '/api/mistral']
  });
});

// ===== DEMAJ SEVE =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Seve ap kouri sou po ${PORT}`);
  console.log(`Radio Tele Mega Star Backend v3.0 pre!`);
  console.log(`Socket.io ready!`);
  console.log(`Mistral API: ${process.env.MISTRAL_API_KEY ? 'KONFIGURE' : 'MANKE — mete nan .env'}`);
});

module.exports = { app, server, io };
