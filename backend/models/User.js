// ============================================
// MODELS/USER.JS — Modèl Itilizatè
// Defini estrikti done itilizatè nan MongoDB
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

  // Enfòmasyon debaz
  nom: {
    type: String,
    required: [true, 'Non obligatwa'],
    trim: true,
    minlength: [2, 'Non dwe gen omwen 2 karaktè']
  },

  email: {
    type: String,
    required: [true, 'Email obligatwa'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email pa valid']
  },

  telephone: {
    type: String,
    trim: true,
    default: ''
  },

  motDePasse: {
    type: String,
    required: [true, 'Modpas obligatwa'],
    minlength: [8, 'Modpas dwe gen omwen 8 karaktè']
  },

  // Foto pwofil
  fotoPwofil: {
    type: String,
    default: ''
  },

  // Dashboard — Estatistik koute
  statistiques: {
    tempsEcoute: { type: Number, default: 0 },      // Tan total an minit
    dernierEcoute: { type: Date, default: null },    // Dènye fwa koute
    emissionsEcoutees: { type: Number, default: 0 } // Kantite emisyon koute
  },

  // Dat enskripsyon
  dateInscription: {
    type: Date,
    default: Date.now
  },

  // Kont aktif oswa pa
  actif: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true // Ajoute createdAt ak updatedAt otomatikman
});

// ============================================
// ANKRIPTE MODPAS ANVAN SOVE
// ============================================
UserSchema.pre('save', async function(next) {
  // Sèlman ankripte si modpas chanje
  if (!this.isModified('motDePasse')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ============================================
// VERIFYE MODPAS
// ============================================
UserSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);