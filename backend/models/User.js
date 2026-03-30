const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Non obligatwa'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email obligatwa'],
    unique: true,
    lowercase: true,
    trim: true
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
  fotoPwofil: {
    type: String,
    default: ''
  },
  statistiques: {
    tempsEcoute: { type: Number, default: 0 },
    dernierEcoute: { type: Date, default: null },
    emissionsEcoutees: { type: Number, default: 0 }
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ankripte modpas anvan sove
UserSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Verifye modpas
UserSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);