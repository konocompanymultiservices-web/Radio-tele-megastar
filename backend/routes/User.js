const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

function stripTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

router.get('/profil', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.put('/profil', authMiddleware, async (req, res) => {
  try {
    // Whitelist only safe profile fields — never allow role, email, motDePasse to be changed here
    const update = {};
    if (req.body.nom       !== undefined) {
      const nom = stripTags(req.body.nom);
      if (nom.length < 1 || nom.length > 100) {
        return res.status(400).json({ success: false, message: 'Non enkòrèk' });
      }
      update.nom = nom;
    }
    if (req.body.telephone !== undefined) {
      const tel = stripTags(req.body.telephone);
      if (tel && !/^[+\d\s\-().]{0,20}$/.test(tel)) {
        return res.status(400).json({ success: false, message: 'Nimewo telefòn enkòrèk' });
      }
      update.telephone = tel;
    }
    if (req.body.fotoPwofil !== undefined) {
      const foto = stripTags(req.body.fotoPwofil);
      // Accept empty string (delete photo) or a data URL or https URL
      if (foto && !foto.startsWith('data:image/') && !/^https?:\/\//i.test(foto)) {
        return res.status(400).json({ success: false, message: 'URL foto enkòrèk' });
      }
      update.fotoPwofil = foto;
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-motDePasse');
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
