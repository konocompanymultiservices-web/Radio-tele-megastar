const mongoose = require('mongoose');

// ===== ATIK / NEWS =====
const NewsSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  contenu: { type: String, default: '' },
  type: { type: String, enum: ['slide', 'news', 'breaking'], default: 'news' },
  imageUrl: { type: String, default: '' },
  actif: { type: Boolean, default: true },
  auteur: { type: String, default: 'Administrateur' }
}, { timestamps: true });

// ===== EMISYON / SCHEDULE =====
const EmissionSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  emoji: { type: String, default: '🎙️' },
  heureDebut: { type: String, required: true },
  heureFin: { type: String, required: true },
  description: { type: String, default: '' },
  couleur: { type: String, default: 'linear-gradient(135deg,#cc0000,#ff6666)' },
  ordre: { type: Number, default: 0 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== PIBLISITE =====
const PubliciteSchema = new mongoose.Schema({
  texte: { type: String, required: true },
  lien: { type: String, default: '' },
  position: { type: String, enum: ['top', 'middle', 'bottom'], default: 'top' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== ANIMATEUR =====
const AnimateurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  emission: { type: String, default: '' },
  horaire: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== REPORTAGE =====
const ReportageSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  lieu: { type: String, default: '' },
  statut: { type: String, enum: ['draft', 'live', 'published'], default: 'draft' },
  auteur: { type: String, default: 'Administrateur' }
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