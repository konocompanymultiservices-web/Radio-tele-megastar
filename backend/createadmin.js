const mongoose = require('mongoose');
require('dotenv').config();

const email = (process.env.ADMIN_EMAILS || '').split(',')[0].toLowerCase().trim();
const password = process.argv[2];

if (!email) {
  console.error('ADMIN_EMAILS pa defini nan .env — mete li epi eseye ankò.');
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error('Itilizasyon: node createadmin.js <modpas-omwen-8-karaktè>');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = require('./models/User');

    const existing = await User.findOne({ email });
    if (existing) {
      // Update role and password
      existing.motDePasse = password;
      existing.role = 'admin';
      await existing.save();
      console.log(`Admin mete ajou: ${email}`);
    } else {
      await User.create({ nom: 'Admin', email, motDePasse: password, telephone: '', role: 'admin' });
      console.log(`Admin kreye: ${email}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Erè:', err.message);
    process.exit(1);
  });
