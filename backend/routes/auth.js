const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Konfigirasyon email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/auth/inscription
router.post('/inscription', async (req, res) => {
  try {
    const { nom, email, telephone, motDePasse } = req.body;

    // Verifye si email deja egziste
    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return res.status(400).json({
        success: false,
        message: 'Yon kont deja egziste ak email sa a'
      });
    }

    // Kreye nouvo itilizatè
    const nouvelUser = new User({ nom, email, telephone, motDePasse });
    await nouvelUser.save();

    // Email bay itilizatè
    await transporter.sendMail({
      from: `"Radio Télé Mega Star" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur Radio Télé Mega Star!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0a0a0a;padding:30px;text-align:center;">
            <h1 style="color:#FFD600;">Radio Télé Mega Star</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2>Bonjour ${nom}!</h2>
            <p>Bienvenue! Votre compte a été créé avec succès.</p>
            <p><strong>Email:</strong> ${email}</p>
            <a href="https://radiotelemegastar.netlify.app"
               style="background:#cc0000;color:white;padding:12px 24px;
                      text-decoration:none;border-radius:8px;display:inline-block;margin-top:16px;">
              Visiter notre site
            </a>
          </div>
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <p style="color:#555;font-size:12px;">© 2026 Radio Télé Mega Star</p>
          </div>
        </div>
      `
    });

    // Email bay admin
    await transporter.sendMail({
      from: `"Radio Télé Mega Star" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Nouvo kont kreye sou Radio Télé Mega Star',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0a0a0a;padding:20px;text-align:center;">
            <h2 style="color:#FFD600;">Nouvo Enskripsyon</h2>
          </div>
          <div style="padding:24px;background:#f9f9f9;">
            <p><strong>Nom:</strong> ${nom}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Téléphone:</strong> ${telephone || 'Non fourni'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      `
    });

    // Kreye token
    const token = jwt.sign(
      { id: nouvelUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Kont kreye ak siksè!',
      token,
      user: {
        id: nouvelUser._id,
        nom: nouvelUser.nom,
        email: nouvelUser.email,
        telephone: nouvelUser.telephone
      }
    });

  } catch (err) {
    console.error('Erè enskripsyon:', err);
    res.status(500).json({
      success: false,
      message: 'Erè sèvè — eseye ankò'
    });
  }
});

// POST /api/auth/connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email oswa modpas enkòrèk'
      });
    }

    const kòrèk = await user.verifierMotDePasse(motDePasse);
    if (!kòrèk) {
      return res.status(401).json({
        success: false,
        message: 'Email oswa modpas enkòrèk'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Koneksyon reyisi!',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        fotoPwofil: user.fotoPwofil,
        statistiques: user.statistiques
      }
    });

  } catch (err) {
    console.error('Erè koneksyon:', err);
    res.status(500).json({
      success: false,
      message: 'Erè sèvè — eseye ankò'
    });
  }
});

module.exports = router;