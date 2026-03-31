const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  telephone: { type: String, default: '' },
  motDePasse: { type: String, required: true, minlength: 6 },
  fotoPwofil: { type: String, default: '' },
  statistiques: {
    tempsEcoute: { type: Number, default: 0 },
    dernierEcoute: { type: Date, default: null },
    emissionsEcoutees: { type: Number, default: 0 }
  },
  dateInscription: { type: Date, default: Date.now },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('motDePasse')) return;
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

UserSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);
