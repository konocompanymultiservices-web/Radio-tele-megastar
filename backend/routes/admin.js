const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { News, Emission, Publicite, Animateur, Reportage, Online } = require('../models/Content');

// ===== MIDDLEWARE ADMIN =====
// Verifye si se yon admin ki ap fè demand lan
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key === process.env.ADMIN_SECRET_KEY) return next();
  // Oswa verifye token JWT ak role admin
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ success: false, message: 'Aksè refize' });
  next(); // Pou kounye a nou aksepte tout demand — nou ka ranfòse pita
}

// ===== ONLINE COUNT =====
router.get('/online', async (req, res) => {
  try {
    let online = await Online.findOne();
    if (!online) online = await Online.create({ count: 0 });
    // Simile yon kalkil reyèl — nou ka amelyore ak Socket.io pita
    const count = online.count;
    res.json({ success: true, count });
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
router.get('/stats', async (req, res) => {
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
        totalMembres,
        abonnesActifs,
        revenusMois,
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
router.get('/membres', async (req, res) => {
  try {
    const membres = await User.find().select('-motDePasse').sort({ createdAt: -1 });
    res.json({ success: true, membres });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.get('/abonnements', async (req, res) => {
  try {
    const membres = await User.find({ plan: { $in: ['Premium', 'VIP', 'Gratuit'] } })
      .select('nom email plan telephone createdAt').sort({ createdAt: -1 });
    res.json({ success: true, abonnements: membres });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ===== NEWS / ATIK =====
router.get('/news', async (req, res) => {
  try {
    const news = await News.find({ actif: true }).sort({ createdAt: -1 });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/news', async (req, res) => {
  try {
    const { titre, contenu, type, imageUrl } = req.body;
    if (!titre) return res.status(400).json({ success: false, message: 'Titre requis' });
    const news = await News.create({ titre, contenu, type: type || 'news', imageUrl: imageUrl || '' });
    
    // 🔌 AJOUTE SA A IKI - PALE A CLIENTS:
    req.io.emit('news:created', {
      success: true,
      news: news,
      message: '📰 Nouvo nouvèl!'
    });
    
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // 🔌 AJOUTE SA:
    req.io.emit('news:updated', {
      success: true,
      news: news,
      message: '✏️ Nouvèl mete ajou'
    });
    
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    
    // 🔌 AJOUTE SA:
    req.io.emit('news:deleted', {
      success: true,
      newsId: req.params.id,
      message: '🗑️ Nouvèl efase'
    });
    
    res.json({ success: true, message: 'Atik efase' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ===== EMISYON / SCHEDULE =====
router.get('/emissions', async (req, res) => {
  try {
    const emissions = await Emission.find({ actif: true }).sort({ ordre: 1, heureDebut: 1 });
    // Si pa gen emisyon nan DB — retounen emisyon defaut yo
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

router.post('/emissions', async (req, res) => {
  try {
    const { nom, emoji, heureDebut, heureFin, description, couleur } = req.body;
    if (!nom || !heureDebut || !heureFin) return res.status(400).json({ success: false, message: 'Champ manke' });
    const emission = await Emission.create({ nom, emoji: emoji || '🎙️', heureDebut, heureFin, description: description || '', couleur: couleur || 'linear-gradient(135deg,#cc0000,#ff6666)' });
    
    // 🔌 AJOUTE:
    req.io.emit('emission:created', {
      success: true,
      emission: emission,
      message: '📻 Nouvo emisyon!'
    });
    
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.put('/emissions/:id', async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // 🔌 AJOUTE:
    req.io.emit('emission:updated', {
      success: true,
      emission: emission,
      message: '✏️ Emisyon mete ajou'
    });
    
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/emissions/:id', async (req, res) => {
  try {
    await Emission.findByIdAndDelete(req.params.id);
    
    // 🔌 AJOUTE:
    req.io.emit('emission:deleted', {
      success: true,
      emissionId: req.params.id,
      message: '🗑️ Emisyon efase'
    });
    
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

router.post('/publicites', async (req, res) => {
  try {
    const { texte, lien, position } = req.body;
    if (!texte) return res.status(400).json({ success: false, message: 'Texte requis' });
    const pub = await Publicite.create({ texte, lien: lien || '', position: position || 'top' });
    res.json({ success: true, publicite: pub });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/publicites/:id', async (req, res) => {
  try {
    await Publicite.findByIdAndDelete(req.params.id);
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

router.post('/animateurs', async (req, res) => {
  try {
    const { nom, emission, horaire, photoUrl } = req.body;
    if (!nom) return res.status(400).json({ success: false, message: 'Nom requis' });
    const anim = await Animateur.create({ nom, emission: emission || '', horaire: horaire || '', photoUrl: photoUrl || '' });
    res.json({ success: true, animateur: anim });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/animateurs/:id', async (req, res) => {
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

router.post('/reportages', async (req, res) => {
  try {
    const { titre, contenu, lieu, statut } = req.body;
    if (!titre || !contenu) return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
    const rep = await Reportage.create({ titre, contenu, lieu: lieu || '', statut: statut || 'draft' });
    res.json({ success: true, reportage: rep });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/reportages/:id', async (req, res) => {
  try {
    await Reportage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;