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
  .then(() => console.log('âœ… MongoDB konekte ak siksÃ¨!'))
  .catch(err => console.error('âŒ ErÃ¨ MongoDB:', err.message));

// TÃˆS WOUT
app.get('/', (req, res) => {
  res.json({
    message: 'ðŸ“» Radio TÃ©lÃ© Mega Star API ap mache!',
    status: 'OK'
  });
});

// WOUT YO
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/User');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// DÃ‰MARRAGE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ðŸš€ SÃ¨vÃ¨ ap kouri sou pÃ² ${PORT}`);
  console.log(`ðŸ“» Radio TÃ©lÃ© Mega Star Backend prÃ¨!`);
});
