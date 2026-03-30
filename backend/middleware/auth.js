const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Aksè refize — ou pa konekte'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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