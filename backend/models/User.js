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
  motDePasse: { type: String, required: true, minlength: 6 },
  fotoPwofil: { type: String, default: '' },
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
  }
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('motDePasse')) return;
  const salt = await bcrypt.genSalt(12);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

UserSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);
