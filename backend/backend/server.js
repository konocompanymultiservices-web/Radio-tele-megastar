// ============================================
// SERVER.JS — Sèvè Prensipal Backend
// Radio Télé Mega Star
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Chaje fichye .env lan
dotenv.config();

const app = express();

// ============================================
// MIDDLEWARE — Konfigirasyon debaz
// ============================================
app.use(cors({
  origin: [
    'https://radiotelemegastar.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// KONEKSYON MONGODB
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB konekte ak siksè!'))
  .catch(err => console.error('❌ Erè MongoDB:', err));

// ============================================
// WOUT YO (Routes)
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

// ============================================
// WOUT TÈS — Verifye si sèvè ap mache
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: '📻 Radio Télé Mega Star API ap mache!',
    version: '1.0.0',
    status: 'OK'
  });
});

// ============================================
// DÉMARRAGE SÈVÈ
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sèvè ap kouri sou pò ${PORT}`);
  console.log(`📻 Radio Télé Mega Star Backend prè!`);
});