const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function envoyerEmailBackground(to, subject, html) {
  transporter.sendMail({ from: `"Radio Télé Mega Star" <${process.env.EMAIL_USER}>`, to, subject, html })
    .then(() => console.log('Email voye:', to))
    .catch(err => console.error('Email echwe:', err.message));
}

router.post('/inscription', async (req, res) => {
  try {
    const { nom, email, telephone, motDePasse } = req.body;
    if (!nom || !email || !motDePasse) return res.status(400).json({ success: false, message: 'Champ manke' });
    const userExiste = await User.findOne({ email });
    if (userExiste) return res.status(400).json({ success: false, message: 'Email deja itilize' });
    const nouvelUser = new User({ nom, email, telephone: telephone || '', motDePasse });
    await nouvelUser.save();
    const token = jwt.sign({ id: nouvelUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'Kont kreye!', token, user: { id: nouvelUser._id, nom: nouvelUser.nom, email: nouvelUser.email } });
    envoyerEmailBackground(email, 'Bienvenue Radio Télé Mega Star', `<p>Bonjou ${nom}, kont ou kreye!</p>`);
    envoyerEmailBackground(process.env.ADMIN_EMAIL, 'Nouvo kont', `<p>Nouvo: ${nom} — ${email}</p>`);
  } catch (err) {
    console.error('Erè enskripsyon:', err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

router.post('/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    if (!email || !motDePasse) return res.status(400).json({ success: false, message: 'Champ manke' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    const korèk = await user.verifierMotDePasse(motDePasse);
    if (!korèk) return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Koneksyon reyisi!', token, user: { id: user._id, nom: user.nom, email: user.email } });
  } catch (err) {
    console.error('Erè koneksyon:', err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
