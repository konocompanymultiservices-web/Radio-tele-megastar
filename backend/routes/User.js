const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ===== SANITIZATION =====
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.slice(0, 50000).replace(/[<>]/g, '').trim();
}

// ===== RATE LIMITER =====
const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Twòp demand — eseye nan yon minit' }
});

router.use(userRateLimiter);

// GET /api/user/profil
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// PUT /api/user/profil
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const update = {};

    if (req.body.nom !== undefined) {
      const nom = sanitize(req.body.nom);
      if (nom.length < 1 || nom.length > 100) {
        return res.status(400).json({ success: false, message: 'Non enkòrèk' });
      }
      update.nom = nom;
    }

    if (req.body.telephone !== undefined) {
      const tel = sanitize(req.body.telephone);
      if (tel && !/^[+\d\s\-().]{0,20}$/.test(tel)) {
        return res.status(400).json({ success: false, message: 'Nimewo telefòn enkòrèk' });
      }
      update.telephone = tel;
    }

    if (req.body.fotoPwofil !== undefined) {
      const foto = sanitize(req.body.fotoPwofil);
      if (foto && !foto.startsWith('data:image/') && !/^https?:\/\//i.test(foto)) {
        return res.status(400).json({ success: false, message: 'URL foto enkòrèk' });
      }
      update.fotoPwofil = foto;
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-motDePasse');
    res.json({ success: true, message: 'Pwofil mete ajou!', user });
  } catch {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// GET /api/user/dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');
    res.json({
      success: true,
      dashboard: {
        profil: { nom: user.nom, email: user.email, telephone: user.telephone, membreDepuis: user.dateInscription },
        statistiques: user.statistiques
      }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
