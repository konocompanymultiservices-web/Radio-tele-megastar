const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ===== INPUT SANITIZATION HELPERS =====
// Strip HTML/script tags from a string to prevent stored XSS via API data
function stripTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Validate phone: allow empty, digits, spaces, +, -, ()
function isValidPhone(phone) {
  if (!phone) return true;
  return /^[+\d\s\-().]{0,20}$/.test(phone);
}

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

    // Normalise and sanitize
    const nomFinal  = stripTags(nom || username || '');
    const mdpFinal  = motDePasse || password || '';
    const emailNorm = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const telFinal  = stripTags(telephone || phone || '');

    // Required field checks
    if (!nomFinal || !emailNorm || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }

    // Enforce reasonable length limits
    if (nomFinal.length > 100) {
      return res.status(400).json({ success: false, message: 'Non twò long (max 100 karaktè)' });
    }

    // Email format validation
    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({ success: false, message: 'Format email enkòrèk' });
    }

    // Password strength: minimum 8 chars
    if (mdpFinal.length < 8) {
      return res.status(400).json({ success: false, message: 'Modpas dwe gen omwen 8 karaktè' });
    }

    // Phone validation
    if (!isValidPhone(telFinal)) {
      return res.status(400).json({ success: false, message: 'Nimewo telefòn enkòrèk' });
    }

    const userExiste = await User.findOne({ email: emailNorm });
    if (userExiste) {
      return res.status(400).json({ success: false, message: 'Email deja itilize' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.toLowerCase().trim()).filter(Boolean);
    const role = adminEmails.includes(emailNorm) ? 'admin' : 'user';

    const nouvelUser = new User({
      nom: nomFinal,
      email: emailNorm,
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

    // Send emails asynchronously after responding (fire-and-forget)
    envoyerEmailBackground(emailNorm, 'Bienvenue sou Radio Télé Mega Star!',
      `<h2>Bonjou ${nouvelUser.nom}!</h2><p>Kont ou kreye ak siksè sou Radio Télé Mega Star 97.3 FM.</p>`);
    if (process.env.ADMIN_EMAIL) {
      envoyerEmailBackground(process.env.ADMIN_EMAIL, 'Nouvo manm!',
        `<p>Nouvo enskripsyon: <strong>${nouvelUser.nom}</strong> (${emailNorm})</p>`);
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
    const mdpFinal   = motDePasse || password || '';
    const emailNorm  = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!emailNorm || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }

    if (!isValidEmail(emailNorm)) {
      // Return generic error — don't reveal whether email exists
      return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      // Use a timing-safe constant response to prevent user enumeration
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
    const rawEmail = req.body.email;
    if (!rawEmail) return res.status(400).json({ success: false, message: 'Email requis' });

    const emailNorm = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';
    if (!isValidEmail(emailNorm)) {
      // Always return the same success message — never confirm whether the email exists
      return res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });
    }

    // Always respond the same way regardless of whether email exists (prevent enumeration)
    const user = await User.findOne({ email: emailNorm });
    if (user) {
      const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const resetUrl = `${process.env.SITE_URL || 'https://radio-tele-megastar.pages.dev'}/reset.html?token=${resetToken}`;

      envoyerEmailBackground(emailNorm, 'Reyinisyalizasyon modpas — Radio Télé Mega Star',
        `<h2>Reyinisyalizasyon modpas</h2>
         <p>Klike sou lyen sa a pou chanje modpas ou (valid pou 1 èdtan):</p>
         <a href="${resetUrl}" style="background:#cc0000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Chanje modpas mwen</a>
         <p style="color:#888;font-size:12px;">Si se pa ou ki mande sa, inyore mesaj sa a.</p>`
      );
    }

    // Always return success — never leak whether email exists in the DB
    res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
