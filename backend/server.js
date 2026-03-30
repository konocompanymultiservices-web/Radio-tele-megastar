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
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// KONEKSYON MONGODB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})

// TÈS WOUT
app.get('/', (req, res) => {
  res.json({
    message: '📻 Radio Télé Mega Star API ap mache!',
    status: 'OK'
  });
});

// WOUT YO
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// DÉMARRAGE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sèvè ap kouri sou pò ${PORT}`);
  console.log(`📻 Radio Télé Mega Star Backend prè!`);
});