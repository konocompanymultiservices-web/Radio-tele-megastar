const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Aksè refize — ou pa konekte' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate the id is a proper ObjectId before hitting the DB (prevents NoSQL injection)
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Token enkòrèk' });
    }

    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User pa egziste' });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ success: false, message: 'Token ekspire — konekte ankò' });
  }
};
