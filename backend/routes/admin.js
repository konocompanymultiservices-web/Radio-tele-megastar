const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { News, Emission, Publicite, Animateur, Reportage, Online } = require('../models/Content');

// ===== MIDDLEWARE ADMIN SOLID =====
async function adminAuth(req, res, next) {
  try {
    // Opsyon 1: Admin secret key (pou skript entèn)
    const key = req.headers['x-admin-key'];
    if (key && key === process.env.ADMIN_SECRET_KEY) return next();

    // Opsyon 2: JWT token ak role admin
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Aksè refize — token manke' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User pa egziste' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Aksè refize — admin sèlman' });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token enkòrèk oswa ekspire' });
  }
}

// ===== ONLINE COUNT =====
router.get('/online', async (req, res) => {
  try {
    let online = await Online.findOne();
    if (!online) online = await Online.create({ count: 0 });
    res.json({ success: true, count: online.count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

router.post('/online/ping', async (req, res) => {
  try {
    const { count } = req.body;
    await Online.findOneAndUpdate({}, { count: count || 0, updatedAt: new Date() }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// ===== STATS ADMIN =====
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalMembres = await User.countDocuments();
    const membres = await User.find().select('nom email plan createdAt');
    let revenusMois = 0;
    membres.forEach(m => {
      if (m.plan === 'Premium') revenusMois += 5;
      else if (m.plan === 'VIP') revenusMois += 15;
    });
    const abonnesActifs = membres.filter(m => m.plan === 'Premium' || m.plan === 'VIP').length;
    let online = await Online.findOne();
    res.json({
      success: true,
      stats: {
        totalMembres, abonnesActifs, revenusMois,
        revenusTotal: revenusMois,
        revenusPremium: membres.filter(m => m.plan === 'Premium').length * 5,
        revenusVIP: membres.filter(m => m.plan === 'VIP').length * 15,
        onlineCount: online ? online.count : 0,
        topEmission: { nom: 'Réveil Matinal', ecoutes: 247 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ===== MEMBRES =====
router.get('/membres', adminAuth, async (req, res) => {
  try {
    const membres = await User.find().select('-motDePasse').sort({ createdAt: -1 });
    res.json({ success: true, membres });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.get('/abonnements', adminAuth, async (req, res) => {
  try {
    const membres = await User.find({ plan: { $in: ['Premium', 'VIP', 'Gratuit'] } })
      .select('nom email plan telephone createdAt').sort({ createdAt: -1 });
    res.json({ success: true, abonnements: membres });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ===== NEWS =====
router.get('/news', async (req, res) => {
  try {
    const news = await News.find({ actif: true }).sort({ createdAt: -1 });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/news', adminAuth, async (req, res) => {
  try {
    const { titre, contenu, type, imageUrl } = req.body;
    if (!titre) return res.status(400).json({ success: false, message: 'Titre requis' });
    const news = await News.create({ titre, contenu, type: type || 'news', imageUrl: imageUrl || '' });
    req.io.emit('news:created', { success: true, news, message: 'Nouvo nouvèl!' });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.put('/news/:id', adminAuth, async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('news:updated', { success: true, news, message: 'Nouvèl mete ajou' });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/news/:id', adminAuth, async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    req.io.emit('news:deleted', { success: true, newsId: req.params.id, message: 'Nouvèl efase' });
    res.json({ success: true, message: 'Atik efase' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ===== EMISYON =====
router.get('/emissions', async (req, res) => {
  try {
    const emissions = await Emission.find({ actif: true }).sort({ ordre: 1, heureDebut: 1 });
    if (!emissions.length) {
      return res.json({
        success: true,
        emissions: [
          { _id: '1', nom: 'Réveil Matinal', emoji: '🌅', heureDebut: '05:00', heureFin: '08:00', couleur: 'linear-gradient(135deg,#cc0000,#ff6666)', ordre: 1 },
          { _id: '2', nom: 'Actualités', emoji: '📰', heureDebut: '08:00', heureFin: '10:00', couleur: 'linear-gradient(135deg,#1a5a1a,#4CAF50)', ordre: 2 },
          { _id: '3', nom: 'Vibes Haïtiennes', emoji: '🎵', heureDebut: '10:00', heureFin: '14:00', couleur: 'linear-gradient(135deg,#996600,#FFD600)', ordre: 3 },
          { _id: '4', nom: 'Débat Citoyen', emoji: '🎤', heureDebut: '14:00', heureFin: '17:00', couleur: 'linear-gradient(135deg,#cc0000,#cc6600)', ordre: 4 },
          { _id: '5', nom: 'Heure Spirituelle', emoji: '🙏', heureDebut: '17:00', heureFin: '19:00', couleur: 'linear-gradient(135deg,#4a0080,#9C27B0)', ordre: 5 },
          { _id: '6', nom: 'Soirée Mega Star', emoji: '🌙', heureDebut: '19:00', heureFin: '22:00', couleur: 'linear-gradient(135deg,#0a0a3a,#1a1a6a)', ordre: 6 }
        ]
      });
    }
    res.json({ success: true, emissions });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/emissions', adminAuth, async (req, res) => {
  try {
    const { nom, emoji, heureDebut, heureFin, description, couleur } = req.body;
    if (!nom || !heureDebut || !heureFin) return res.status(400).json({ success: false, message: 'Champ manke' });
    const emission = await Emission.create({ nom, emoji: emoji || '🎙️', heureDebut, heureFin, description: description || '', couleur: couleur || 'linear-gradient(135deg,#cc0000,#ff6666)' });
    req.io.emit('emission:created', { success: true, emission, message: 'Nouvo emisyon!' });
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.put('/emissions/:id', adminAuth, async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('emission:updated', { success: true, emission, message: 'Emisyon mete ajou' });
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/emissions/:id', adminAuth, async (req, res) => {
  try {
    await Emission.findByIdAndDelete(req.params.id);
    req.io.emit('emission:deleted', { success: true, emissionId: req.params.id, message: 'Emisyon efase' });
    res.json({ success: true, message: 'Emisyon efase' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ===== PIBLISITE =====
router.get('/publicites', async (req, res) => {
  try {
    const pubs = await Publicite.find({ actif: true }).sort({ createdAt: -1 });
    res.json({ success: true, publicites: pubs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/publicites', adminAuth, async (req, res) => {
  try {
    const { texte, lien, position } = req.body;
    if (!texte) return res.status(400).json({ success: false, message: 'Texte requis' });
    const pub = await Publicite.create({ texte, lien: lien || '', position: position || 'top' });
    req.io.emit('publicite:created', { success: true, publicite: pub, message: 'Nouvo piblisite!' });
    res.json({ success: true, publicite: pub });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/publicites/:id', adminAuth, async (req, res) => {
  try {
    await Publicite.findByIdAndDelete(req.params.id);
    req.io.emit('publicite:deleted', { success: true, message: 'Piblisite efase' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ===== ANIMATEURS =====
router.get('/animateurs', async (req, res) => {
  try {
    const animateurs = await Animateur.find({ actif: true }).sort({ createdAt: -1 });
    res.json({ success: true, animateurs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/animateurs', adminAuth, async (req, res) => {
  try {
    const { nom, emission, horaire, photoUrl } = req.body;
    if (!nom) return res.status(400).json({ success: false, message: 'Nom requis' });
    const anim = await Animateur.create({ nom, emission: emission || '', horaire: horaire || '', photoUrl: photoUrl || '' });
    res.json({ success: true, animateur: anim });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/animateurs/:id', adminAuth, async (req, res) => {
  try {
    await Animateur.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ===== REPORTAGE =====
router.get('/reportages', async (req, res) => {
  try {
    const reportages = await Reportage.find().sort({ createdAt: -1 });
    res.json({ success: true, reportages });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/reportages', adminAuth, async (req, res) => {
  try {
    const { titre, contenu, lieu, statut } = req.body;
    if (!titre || !contenu) return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
    const rep = await Reportage.create({ titre, contenu, lieu: lieu || '', statut: statut || 'draft' });
    res.json({ success: true, reportage: rep });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/reportages/:id', adminAuth, async (req, res) => {
  try {
    await Reportage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
