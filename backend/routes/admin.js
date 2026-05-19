const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { News, Emission, Publicite, Animateur, Reportage, Online } = require('../models/content');

// ===== SANITIZATION HELPER =====
function stripTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Validate AND convert to ObjectId — prevents NoSQL injection via URL params
function toObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

// ===== ADMIN RATE LIMITER (30 req/min per IP) =====
// Applied to all routes in this router via router.use() below
const _adminCounts = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of _adminCounts.entries()) {
    if (now > data.resetTime) _adminCounts.delete(ip);
  }
}, 5 * 60 * 1000);

function adminRateLimiter(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
  const ip = /^[\d.:a-fA-F]+$/.test(rawIp) ? rawIp : req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 30;

  if (!_adminCounts.has(ip)) {
    _adminCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = _adminCounts.get(ip);
    if (now > data.resetTime) {
      _adminCounts.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      data.count++;
      if (data.count > max) {
        res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
        return res.status(429).json({ success: false, message: 'Twòp demand — eseye nan yon minit' });
      }
    }
  }
  next();
}

// Apply rate limiter to every route in this router
router.use(adminRateLimiter);

// ===== MIDDLEWARE ADMIN =====
async function adminAuth(req, res, next) {
  try {
    const key = req.headers['x-admin-key'];
    if (key) {
      if (!process.env.ADMIN_SECRET_KEY) {
        return res.status(500).json({ success: false, message: 'Konfigirasyon sèvè inkomplet' });
      }
      if (key === process.env.ADMIN_SECRET_KEY) return next();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Aksè refize — token manke' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const oid = toObjectId(decoded.id);
    if (!oid) return res.status(401).json({ success: false, message: 'Token enkòrèk' });

    const user = await User.findById(oid).select('-motDePasse');
    if (!user) return res.status(401).json({ success: false, message: 'User pa egziste' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Aksè refize — admin sèlman' });

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

router.post('/online/ping', adminAuth, async (req, res) => {
  try {
    const count = parseInt(req.body.count, 10);
    const safeCount = isNaN(count) || count < 0 ? 0 : count;
    await Online.findOneAndUpdate({}, { count: safeCount, updatedAt: new Date() }, { upsert: true });
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
    const online = await Online.findOne();
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
    const titre    = stripTags(req.body.titre    || '');
    const contenu  = stripTags(req.body.contenu  || '');
    const imageUrl = stripTags(req.body.imageUrl || '');
    const ALLOWED_TYPES = ['slide', 'news', 'breaking'];
    const type = ALLOWED_TYPES.includes(req.body.type) ? req.body.type : 'news';

    if (!titre) return res.status(400).json({ success: false, message: 'Titre requis' });
    if (titre.length > 300)    return res.status(400).json({ success: false, message: 'Titre twò long (max 300)' });
    if (contenu.length > 10000) return res.status(400).json({ success: false, message: 'Contenu twò long (max 10000)' });
    if (imageUrl.length > 500)  return res.status(400).json({ success: false, message: 'URL imaj twò long (max 500)' });

    const news = await News.create({ titre, contenu, type, imageUrl });
    req.io.emit('news:created', { success: true, news, message: 'Nouvo nouvèl!' });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.put('/news/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });

    const ALLOWED_TYPES = ['slide', 'news', 'breaking'];
    const update = {};
    if (req.body.titre    !== undefined) update.titre    = stripTags(String(req.body.titre));
    if (req.body.contenu  !== undefined) update.contenu  = stripTags(String(req.body.contenu));
    if (req.body.imageUrl !== undefined) update.imageUrl = stripTags(String(req.body.imageUrl));
    if (req.body.type     !== undefined) update.type     = ALLOWED_TYPES.includes(req.body.type) ? req.body.type : 'news';
    if (req.body.actif    !== undefined) update.actif    = Boolean(req.body.actif);

    const news = await News.findByIdAndUpdate(oid, { $set: update }, { new: true, runValidators: true });
    if (!news) return res.status(404).json({ success: false, message: 'Nouvèl pa jwenn' });
    req.io.emit('news:updated', { success: true, news, message: 'Nouvèl mete ajou' });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/news/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });
    await News.findByIdAndDelete(oid);
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
          { _id: '1', nom: 'Réveil Matinal',    emoji: '🌅', heureDebut: '05:00', heureFin: '08:00', couleur: 'linear-gradient(135deg,#cc0000,#ff6666)', ordre: 1 },
          { _id: '2', nom: 'Actualités',         emoji: '📰', heureDebut: '08:00', heureFin: '10:00', couleur: 'linear-gradient(135deg,#1a5a1a,#4CAF50)', ordre: 2 },
          { _id: '3', nom: 'Vibes Haïtiennes',   emoji: '🎵', heureDebut: '10:00', heureFin: '14:00', couleur: 'linear-gradient(135deg,#996600,#FFD600)', ordre: 3 },
          { _id: '4', nom: 'Débat Citoyen',      emoji: '🎤', heureDebut: '14:00', heureFin: '17:00', couleur: 'linear-gradient(135deg,#cc0000,#cc6600)', ordre: 4 },
          { _id: '5', nom: 'Heure Spirituelle',  emoji: '🙏', heureDebut: '17:00', heureFin: '19:00', couleur: 'linear-gradient(135deg,#4a0080,#9C27B0)', ordre: 5 },
          { _id: '6', nom: 'Soirée Mega Star',   emoji: '🌙', heureDebut: '19:00', heureFin: '22:00', couleur: 'linear-gradient(135deg,#0a0a3a,#1a1a6a)', ordre: 6 }
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
    const nom         = stripTags(req.body.nom         || '');
    const emoji       = stripTags(req.body.emoji       || '🎙️').substring(0, 4);
    const heureDebut  = stripTags(req.body.heureDebut  || '');
    const heureFin    = stripTags(req.body.heureFin    || '');
    const description = stripTags(req.body.description || '');
    const couleur     = stripTags(req.body.couleur     || 'linear-gradient(135deg,#cc0000,#ff6666)');

    if (!nom || !heureDebut || !heureFin) return res.status(400).json({ success: false, message: 'Champ manke' });
    if (nom.length > 200)         return res.status(400).json({ success: false, message: 'Nom twò long (max 200)' });
    if (description.length > 2000) return res.status(400).json({ success: false, message: 'Deskripsyon twò long (max 2000)' });
    if (couleur.length > 200)      return res.status(400).json({ success: false, message: 'Couleur twò long (max 200)' });

    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(heureDebut) || !timeRe.test(heureFin)) {
      return res.status(400).json({ success: false, message: 'Format lè enkòrèk (HH:MM)' });
    }

    const emission = await Emission.create({ nom, emoji, heureDebut, heureFin, description, couleur });
    req.io.emit('emission:created', { success: true, emission, message: 'Nouvo emisyon!' });
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.put('/emissions/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });

    const update = {};
    if (req.body.nom         !== undefined) update.nom         = stripTags(String(req.body.nom));
    if (req.body.emoji       !== undefined) update.emoji       = stripTags(String(req.body.emoji)).substring(0, 4);
    if (req.body.heureDebut  !== undefined) update.heureDebut  = stripTags(String(req.body.heureDebut));
    if (req.body.heureFin    !== undefined) update.heureFin    = stripTags(String(req.body.heureFin));
    if (req.body.description !== undefined) update.description = stripTags(String(req.body.description));
    if (req.body.couleur     !== undefined) update.couleur     = stripTags(String(req.body.couleur));
    if (req.body.actif       !== undefined) update.actif       = Boolean(req.body.actif);
    if (req.body.ordre       !== undefined) {
      const ord = parseInt(req.body.ordre, 10);
      if (!isNaN(ord)) update.ordre = ord;
    }

    const emission = await Emission.findByIdAndUpdate(oid, { $set: update }, { new: true, runValidators: true });
    if (!emission) return res.status(404).json({ success: false, message: 'Emisyon pa jwenn' });
    req.io.emit('emission:updated', { success: true, emission, message: 'Emisyon mete ajou' });
    res.json({ success: true, emission });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/emissions/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });
    await Emission.findByIdAndDelete(oid);
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
    const texte    = stripTags(req.body.texte || '');
    const lien     = stripTags(req.body.lien  || '');
    const ALLOWED_POSITIONS = ['top', 'middle', 'bottom'];
    const position = ALLOWED_POSITIONS.includes(req.body.position) ? req.body.position : 'top';

    if (!texte) return res.status(400).json({ success: false, message: 'Texte requis' });
    if (texte.length > 1000) return res.status(400).json({ success: false, message: 'Texte twò long (max 1000)' });
    if (lien && !/^https?:\/\//i.test(lien)) {
      return res.status(400).json({ success: false, message: 'Lyen dwe kòmanse ak https://' });
    }

    const pub = await Publicite.create({ texte, lien, position });
    req.io.emit('publicite:created', { success: true, publicite: pub, message: 'Nouvo piblisite!' });
    res.json({ success: true, publicite: pub });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/publicites/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });
    await Publicite.findByIdAndDelete(oid);
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
    const nom      = stripTags(req.body.nom      || '');
    const emission = stripTags(req.body.emission || '');
    const horaire  = stripTags(req.body.horaire  || '');
    const photoUrl = stripTags(req.body.photoUrl || '');

    if (!nom) return res.status(400).json({ success: false, message: 'Nom requis' });
    if (nom.length > 200) return res.status(400).json({ success: false, message: 'Nom twò long (max 200)' });
    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      return res.status(400).json({ success: false, message: 'URL foto dwe kòmanse ak https://' });
    }

    const anim = await Animateur.create({ nom, emission, horaire, photoUrl });
    res.json({ success: true, animateur: anim });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/animateurs/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });
    await Animateur.findByIdAndDelete(oid);
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
    const titre   = stripTags(req.body.titre   || '');
    const contenu = stripTags(req.body.contenu || '');
    const lieu    = stripTags(req.body.lieu    || '');
    const ALLOWED_STATUTS = ['draft', 'live', 'published'];
    const statut  = ALLOWED_STATUTS.includes(req.body.statut) ? req.body.statut : 'draft';

    if (!titre || !contenu) return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
    if (titre.length > 300)    return res.status(400).json({ success: false, message: 'Titre twò long (max 300)' });
    if (contenu.length > 20000) return res.status(400).json({ success: false, message: 'Contenu twò long (max 20000)' });
    if (lieu.length > 200)      return res.status(400).json({ success: false, message: 'Lieu twò long (max 200)' });

    const rep = await Reportage.create({ titre, contenu, lieu, statut });
    res.json({ success: true, reportage: rep });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.delete('/reportages/:id', adminAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ success: false, message: 'ID enkòrèk' });
    await Reportage.findByIdAndDelete(oid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
