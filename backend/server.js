const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
dotenv.config();

const { Online } = require('./models/content');

// ===== STARTUP GUARDS — fail fast on missing or weak env vars =====
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  console.error('FATAL: JWT_SECRET manke oswa twò kout (min 64 karaktè). Jenere yon nouvo ak:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI manke. Mete li nan backend/.env epi redémarre.');
  process.exit(1);
}
if (!process.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY.length < 32) {
  console.error('FATAL: ADMIN_SECRET_KEY manke oswa twò kout (min 32 karaktè). Jenere yon nouvo ak:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}
// Warn about common placeholder values — prevent accidental deploys with test secrets
const BANNED_SECRETS = ['secret', 'password', 'changeme', 'kle_sekre', 'admin', 'test'];
const jwt_lower = process.env.JWT_SECRET.toLowerCase();
const adm_lower = process.env.ADMIN_SECRET_KEY.toLowerCase();
if (BANNED_SECRETS.some(b => jwt_lower.includes(b)) || BANNED_SECRETS.some(b => adm_lower.includes(b))) {
  console.error('FATAL: JWT_SECRET oswa ADMIN_SECRET_KEY sanble se yon placeholder. Chanje yo ak kle aléatwa reyèl.');
  process.exit(1);
}

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

// Mistral limiter: 20 req/min per IP — prevents API quota exhaustion / billing abuse
const mistralCounts = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of mistralCounts.entries()) {
    if (now > data.resetTime) mistralCounts.delete(ip);
  }
}, 5 * 60 * 1000);
const mistralRateLimiter = createRateLimiter(mistralCounts, 60 * 1000, 20);

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
let _onlinePersistTimer = null;

function persistOnlineCount() {
  if (_onlinePersistTimer) return;
  _onlinePersistTimer = setTimeout(async () => {
    _onlinePersistTimer = null;
    try {
      await Online.findOneAndUpdate({}, { count: onlineUsers, updatedAt: new Date() }, { upsert: true });
    } catch (e) { /* non-critical */ }
  }, 5000);
}

io.on('connection', (socket) => {
  console.log('User conecte');
  onlineUsers++;
  io.emit('onlineCount', onlineUsers);
  persistOnlineCount();

  socket.on('disconnect', () => {
    console.log('User dekonekte');
    if (onlineUsers > 0) onlineUsers--;
    io.emit('onlineCount', onlineUsers);
    persistOnlineCount();
  });
});

// ===== MONGODB =====
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,   // fail fast if Atlas unreachable
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('MongoDB konekte!'))
  .catch(err => {
    console.error('MongoDB ere:', err.message);
    // Don't exit — Railway restarts the process automatically
  });

// ===== ROUTES =====
const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/User');
const adminRoutes   = require('./routes/admin');
const mistralRoutes = require('./routes/mistral');

app.use('/api/auth',    authRateLimiter, authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/mistral', mistralRateLimiter, mistralRoutes);

// ===== ROUTE DEFO + HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Radio Tele Mega Star API — En ligne!', version: '3.1' });
});

// Health check — used by Railway uptime monitoring and load balancers
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
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
