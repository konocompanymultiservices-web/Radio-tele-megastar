const mongoose = require('mongoose');

// ===== ATIK / NEWS =====
const NewsSchema = new mongoose.Schema({
  titre: { type: String, required: true, maxlength: 300 },
  contenu: { type: String, default: '', maxlength: 10000 },
  type: { type: String, enum: ['slide', 'news', 'breaking'], default: 'news' },
  imageUrl: { type: String, default: '', maxlength: 500 },
  actif: { type: Boolean, default: true },
  auteur: { type: String, default: 'Administrateur', maxlength: 200 }
}, { timestamps: true });

// ===== EMISYON / SCHEDULE =====
const EmissionSchema = new mongoose.Schema({
  nom: { type: String, required: true, maxlength: 200 },
  emoji: { type: String, default: '🎙️', maxlength: 8 },
  heureDebut: { type: String, required: true, maxlength: 5 },
  heureFin: { type: String, required: true, maxlength: 5 },
  description: { type: String, default: '', maxlength: 2000 },
  couleur: { type: String, default: 'linear-gradient(135deg,#cc0000,#ff6666)', maxlength: 200 },
  ordre: { type: Number, default: 0 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== PIBLISITE =====
const PubliciteSchema = new mongoose.Schema({
  texte: { type: String, required: true, maxlength: 1000 },
  lien: { type: String, default: '', maxlength: 500 },
  position: { type: String, enum: ['top', 'middle', 'bottom'], default: 'top' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== ANIMATEUR =====
const AnimateurSchema = new mongoose.Schema({
  nom: { type: String, required: true, maxlength: 200 },
  emission: { type: String, default: '', maxlength: 200 },
  horaire: { type: String, default: '', maxlength: 100 },
  photoUrl: { type: String, default: '', maxlength: 500 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== REPORTAGE =====
const ReportageSchema = new mongoose.Schema({
  titre: { type: String, required: true, maxlength: 300 },
  contenu: { type: String, required: true, maxlength: 20000 },
  lieu: { type: String, default: '', maxlength: 200 },
  statut: { type: String, enum: ['draft', 'live', 'published'], default: 'draft' },
  auteur: { type: String, default: 'Administrateur', maxlength: 200 }
}, { timestamps: true });

// ===== ONLINE TRACKER =====
const OnlineSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  News: mongoose.model('News', NewsSchema),
  Emission: mongoose.model('Emission', EmissionSchema),
  Publicite: mongoose.model('Publicite', PubliciteSchema),
  Animateur: mongoose.model('Animateur', AnimateurSchema),
  Reportage: mongoose.model('Reportage', ReportageSchema),
  Online: mongoose.model('Online', OnlineSchema)
};