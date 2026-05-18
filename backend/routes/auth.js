const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function envoyerEmailBackground(to, subject, html) {
  transporter.sendMail({
    from: `"Radio Télé Mega Star" <${process.env.EMAIL_USER}>`,
    to, subject, html
  }).catch(err => console.error('Email error:', err.message));
}

// =========================
// INSCRIPTION (frontend rele /api/auth/inscription)
// =========================
router.post(["/signup", "/inscription"], async (req, res) => {
  try {
    const { nom, username, email, telephone, phone, motDePasse, password } = req.body;
    const nomFinal = nom || username;
    const mdpFinal = motDePasse || password;
    const telFinal = telephone || phone || '';

    if (!nomFinal || !email || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }

    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return res.status(400).json({ success: false, message: 'Email deja itilize' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@megastar.com').split(',');
    const role = adminEmails.includes(email.toLowerCase().trim()) ? 'admin' : 'user';

    const nouvelUser = new User({
      nom: nomFinal,
      email,
      telephone: telFinal,
      motDePasse: mdpFinal,
      role
    });

    await nouvelUser.save();

    const token = jwt.sign(
      { id: nouvelUser._id, role: nouvelUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: nouvelUser._id,
        nom: nouvelUser.nom,
        email: nouvelUser.email,
        role: nouvelUser.role
      }
    });

    envoyerEmailBackground(email, 'Bienvenue sou Radio Télé Mega Star!',
      `<h2>Bonjou ${nomFinal}!</h2><p>Kont ou kreye ak siksè sou Radio Télé Mega Star 97.3 FM.</p>`);
    if (process.env.ADMIN_EMAIL) {
      envoyerEmailBackground(process.env.ADMIN_EMAIL, 'Nouvo manm!',
        `<p>Nouvo enskripsyon: <strong>${nomFinal}</strong> (${email})</p>`);
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// =========================
// KONEKSYON (frontend rele /api/auth/connexion)
// =========================
router.post(["/login", "/connexion"], async (req, res) => {
  try {
    const { email, motDePasse, password } = req.body;
    const mdpFinal = motDePasse || password;

    if (!email || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    }

    const ok = await user.verifierMotDePasse(mdpFinal);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Koneksyon reyisi!',
      token,
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// =========================
// RESET MOT DE PASSE
// =========================
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email introuvable' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.SITE_URL || 'https://radio-tele-megastar.pages.dev'}/reset.html?token=${resetToken}`;

    envoyerEmailBackground(email, 'Reyinisyalizasyon modpas — Radio Télé Mega Star',
      `<h2>Reyinisyalizasyon modpas</h2>
       <p>Klike sou lyen sa a pou chanje modpas ou (valid pou 1 èdtan):</p>
       <a href="${resetUrl}" style="background:#cc0000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Chanje modpas mwen</a>
       <p style="color:#888;font-size:12px;">Si se pa ou ki mande sa, inyore mesaj sa a.</p>`
    );

    res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
