const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = require('./models/User');
    const existing = await User.findOne({ email: 'admin@megastar.com' });
    if (existing) {
      console.log('Admin deja egziste!');
      process.exit();
    }
    await User.create({
      nom: 'Admin',
      email: 'admin@megastar.com',
      motDePasse: 'MegaStar2026!',
      telephone: ''
    });
    console.log('Admin kreye ak siksè!');
    process.exit();
  })
  .catch(err => {
    console.error('Erè:', err.message);
    process.exit(1);
  });