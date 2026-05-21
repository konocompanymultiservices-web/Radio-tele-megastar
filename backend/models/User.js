const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  telephone: {
    type: String,
    default: '',
    trim: true,
    maxlength: [20, 'Nimewo telefòn twò long (max 20 karaktè)'],
    validate: {
      validator: (v) => !v || /^[+\d\s\-().]{0,20}$/.test(v),
      message: 'Nimewo telefòn enkòrèk'
    }
  },
  motDePasse: { type: String, required: true, minlength: 8 },
  fotoPwofil: { type: String, default: '', maxlength: 500 },
  statistiques: {
    tempsEcoute: { type: Number, default: 0 },
    dernierEcoute: { type: Date, default: null },
    emissionsEcoutees: { type: Number, default: 0 }
  },
  dateInscription: { type: Date, default: Date.now },
  actif: { type: Boolean, default: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // plan field is referenced by admin routes and dashboard; must be in schema
  plan: {
    type: String,
    enum: ['Gratuit', 'Premium', 'VIP'],
    default: 'Gratuit'
  },
  lastLogin: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, { timestamps: true });

// Explicit index on email for query performance (unique constraint already enforced by schema)
UserSchema.index({ email: 1 }, { unique: true });

// Compound index for admin stats queries filtering by role + plan
UserSchema.index({ role: 1, plan: 1 });

// Virtual: returns true if account is currently locked out
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', async function() {
  if (!this.isModified('motDePasse')) return;
  const salt = await bcrypt.genSalt(12);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

UserSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);
