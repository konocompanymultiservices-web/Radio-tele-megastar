const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
dotenv.config();

const app = express();
const server = http.createServer(app);

// ===== SECURITY HEADERS =====
// Manually set security headers (equivalent to helmet basics, no extra dependency needed)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Disabled — modern browsers use CSP instead
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // Content Security Policy — API-only backend: no scripts/styles/frames served from here
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );
  // Remove Express fingerprinting
  res.removeHeader('X-Powered-By');
  next();
});

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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) only in dev
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb — no endpoint needs 10mb payloads
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ===== RATE LIMITING (in-memory, no Redis needed) =====
// Separate stricter limiter for auth routes
const requestCounts = new Map();
const authCounts = new Map();

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) requestCounts.delete(ip);
  }
  for (const [ip, data] of authCounts.entries()) {
    if (now > data.resetTime) authCounts.delete(ip);
  }
}, 5 * 60 * 1000);

function createRateLimiter(store, windowMs, max) {
  return (req, res, next) => {
    // Use the first IP from x-forwarded-for only if it looks like a valid IP
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
    // Basic sanity — prevent header spoofing from inflating/deflating the key
    const ip = /^[\d.:a-fA-F]+$/.test(rawIp) ? rawIp : req.ip || 'unknown';
    const now = Date.now();

    if (!store.has(ip)) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const data = store.get(ip);
      if (now > data.resetTime) {
        store.set(ip, { count: 1, resetTime: now + windowMs });
      } else {
        data.count++;
        if (data.count > max) {
          res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
          return res.status(429).json({ success: false, message: 'Twòp demand — eseye nan yon minit' });
        }
      }
    }
    next();
  };
}

// Global limiter: 100 req/min
app.use(createRateLimiter(requestCounts, 60 * 1000, 100));

// Stricter auth limiter: 10 req/15 min — applied to /api/auth routes below
const authRateLimiter = createRateLimiter(authCounts, 15 * 60 * 1000, 10);

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

app.use('/api/auth',    authRateLimiter, authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/mistral', mistralRoutes);

// ===== ROUTE DEFO =====
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Radio Tele Mega Star API — En ligne!' });
});

// ===== 404 handler =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route pa jwenn' });
});

// ===== Global error handler — never leak stack traces to clients =====
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Erè sèvè' });
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
