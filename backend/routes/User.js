const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/user/profil
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// PUT /api/user/profil
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nom, telephone, fotoPwofil } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom, telephone, fotoPwofil },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    res.json({ success: true, message: 'Pwofil mete ajou!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// PUT /api/user/changer-modpas
router.put('/changer-modpas', authMiddleware, async (req, res) => {
  try {
    const { ancienModpas, nouveauModpas } = req.body;
    const user = await User.findById(req.user._id);

    const kòrèk = await user.verifierMotDePasse(ancienModpas);
    if (!kòrèk) {
      return res.status(400).json({
        success: false,
        message: 'Ansyen modpas pa kòrèk'
      });
    }

    user.motDePasse = nouveauModpas;
    await user.save();

    res.json({ success: true, message: 'Modpas chanje ak siksè!' });
  } catch (err) {
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
        profil: {
          nom: user.nom,
          email: user.email,
          telephone: user.telephone,
          fotoPwofil: user.fotoPwofil,
          membreDepuis: user.dateInscription
        },
        statistiques: {
          tempsEcoute: user.statistiques.tempsEcoute || 0,
          emissionsEcoutees: user.statistiques.emissionsEcoutees || 0,
          dernierEcoute: user.statistiques.dernierEcoute
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;