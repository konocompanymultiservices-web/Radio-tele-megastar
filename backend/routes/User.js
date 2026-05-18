const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.get('/profil', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nom, telephone, fotoPwofil } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { nom, telephone, fotoPwofil }, { new: true }).select('-motDePasse');
    res.json({ success: true, message: 'Pwofil mete ajou!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');
    res.json({ success: true, dashboard: { profil: { nom: user.nom, email: user.email, telephone: user.telephone, membreDepuis: user.dateInscription }, statistiques: user.statistiques }});
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
