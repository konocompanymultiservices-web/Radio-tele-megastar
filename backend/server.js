const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// MIDDLEWARE
app.use(cors({
  origin: [
    'https://radiotelemegastar.netlify.app',
    'https://radio-tele-megastar.pages.dev',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// KONEKSYON MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB konekte ak siksè!'))
  .catch(err => console.error('❌ MongoDB erè:', err.message));

// ROUT YO
const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/api/auth',  authRoutes);
app.use('/api/user',  userRoutes);
app.use('/api/admin', adminRoutes);

// ROUT DEFO
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎙️ Radio Télé Mega Star API — En ligne!',
    version: '2.0',
    routes: ['/api/auth', '/api/user', '/api/admin']
  });
});

// DÉMÀRAJ SÈVÈ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sèvè ap kouri sou pò ${PORT}`);
  console.log(`📻 Radio Télé Mega Star Backend prè!`);
});