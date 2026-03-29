// ============================================
// MIDDLEWARE/AUTH.JS — Pwoteksyon Wout yo
// Verifye si itilizatè konekte anvan aksè
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Jwenn token nan header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Aksè refize — ou pa konekte'
      });
    }

    // Verifye token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Jwenn itilizatè a
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token pa valid'
      });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Token ekspire — konekte ankò'
    });
  }
};