// ============================================
// ROUTES/USER.JS — Pwofil ak Dashboard
// ============================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ============================================
// WOUT: GET /api/user/profil
// Jwenn pwofil itilizatè konekte a
// ============================================
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ============================================
// WOUT: PUT /api/user/profil
// Mete ajou pwofil itilizatè
// ============================================
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nom, telephone, fotoPwofil } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom, telephone, fotoPwofil },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    res.json({
      success: true,
      message: 'Pwofil mete ajou!',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ============================================
// WOUT: PUT /api/user/changer-modpas
// Chanje modpas itilizatè
// ============================================
router.put('/changer-modpas', authMiddleware, async (req, res) => {
  try {
    const { ancienModpas, nouveauModpas } = req.body;

    const user = await User.findById(req.user._id);

    // Verifye ansyen modpas
    const kòrèk = await user.verifierMotDePasse(ancienModpas);
    if (!kòrèk) {
      return res.status(400).json({
        success: false,
        message: 'Ansyen modpas pa kòrèk'
      });
    }

    user.motDePasse = nouveauModpas;
    await user.save();

    res.json({
      success: true,
      message: 'Modpas chanje ak siksè!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ============================================
// WOUT: PUT /api/user/statistiques
// Mete ajou statistik koute
// ============================================
router.put('/statistiques', authMiddleware, async (req, res) => {
  try {
    const { tempsEcoute, emissionsEcoutees } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'statistiques.tempsEcoute': tempsEcoute,
        'statistiques.emissionsEcoutees': emissionsEcoutees,
        'statistiques.dernierEcoute': new Date()
      },
      { new: true }
    ).select('-motDePasse');

    res.json({
      success: true,
      message: 'Statistik mete ajou!',
      statistiques: user.statistiques
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ============================================
// WOUT: GET /api/user/dashboard
// Dashboard konplè itilizatè
// ============================================
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');

    const dashboard = {
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
        dernierEcoute: user.statistiques.dernierEcoute,
        // Konvèti tan an fòma lisib
        tempsEcouteFormate: formatTemps(user.statistiques.tempsEcoute || 0)
      }
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ============================================
// FONKSYON ITIL — Fòmate tan
// ============================================
function formatTemps(minit) {
  if (minit < 60) return `${minit} minit`;
  const èdtan = Math.floor(minit / 60);
  const min = minit % 60;
  return `${èdtan}h ${min}min`;
}

module.exports = router;