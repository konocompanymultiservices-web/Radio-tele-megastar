const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ===== SANITIZATION =====
// Remove ALL angle brackets — no ReDoS risk, handles malformed/nested tags completely
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.slice(0, 50000).replace(/[<>]/g, '').trim();
}

// HTML-encode user data before inserting into email HTML templates
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) return true;
  return /^[+\d\s\-().]{0,20}$/.test(phone);
}

// ===== RATE LIMITERS =====
// Strict limiter for signup/reset (5 per 15 min — prevents account farming & email flooding)
const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Twòp eseye — tann 15 minit' }
});

// Moderate limiter for login (10 per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Twòp eseye koneksyon — tann 15 minit' }
});

// ===== EMAIL =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function envoyerEmailBackground(to, subject, html) {
  transporter.sendMail({
    from: `"Radio Télé Mega Star" <${process.env.EMAIL_USER}>`,
    to, subject, html
  }).catch(err => console.error('Email error:', err.message));
}

// =========================
// INSCRIPTION
// =========================
router.post(["/signup", "/inscription"], authStrictLimiter, async (req, res) => {
  try {
    const { nom, username, email, telephone, phone, motDePasse, password } = req.body;

    if (typeof (nom || username) !== 'string' || typeof email !== 'string' || typeof (motDePasse || password) !== 'string') {
      return res.status(400).json({ success: false, message: 'Champ enkòrèk' });
    }

    const nomFinal  = sanitize(nom || username || '');
    const mdpFinal  = motDePasse || password || '';
    const emailNorm = email.toLowerCase().trim();
    const telFinal  = sanitize(telephone || phone || '');

    if (!nomFinal || !emailNorm || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }
    if (nomFinal.length > 100) {
      return res.status(400).json({ success: false, message: 'Non twò long (max 100 karaktè)' });
    }
    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({ success: false, message: 'Format email enkòrèk' });
    }
    if (emailNorm.length > 254) {
      return res.status(400).json({ success: false, message: 'Email twò long' });
    }
    if (mdpFinal.length < 8) {
      return res.status(400).json({ success: false, message: 'Modpas dwe gen omwen 8 karaktè' });
    }
    if (mdpFinal.length > 128) {
      return res.status(400).json({ success: false, message: 'Modpas twò long (max 128 karaktè)' });
    }
    if (!isValidPhone(telFinal)) {
      return res.status(400).json({ success: false, message: 'Nimewo telefòn enkòrèk' });
    }

    const userExiste = await User.findOne({ email: emailNorm });
    if (userExiste) {
      return res.status(400).json({ success: false, message: 'Email deja itilize' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.toLowerCase().trim()).filter(Boolean);
    const role = adminEmails.includes(emailNorm) ? 'admin' : 'user';

    const nouvelUser = new User({ nom: nomFinal, email: emailNorm, telephone: telFinal, motDePasse: mdpFinal, role });
    await nouvelUser.save();

    const token = jwt.sign({ id: nouvelUser._id, role: nouvelUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true, token,
      user: { id: nouvelUser._id, nom: nouvelUser.nom, email: nouvelUser.email, role: nouvelUser.role }
    });

    // HTML-encode user data before inserting into email HTML (prevents stored XSS in email clients)
    const safeName = escapeHtml(nouvelUser.nom);
    envoyerEmailBackground(emailNorm, 'Bienvenue sou Radio Télé Mega Star!',
      `<h2>Bonjou ${safeName}!</h2><p>Kont ou kreye ak siksè sou Radio Télé Mega Star 97.3 FM.</p>`);
    if (process.env.ADMIN_EMAIL) {
      envoyerEmailBackground(process.env.ADMIN_EMAIL, 'Nouvo manm!',
        `<p>Nouvo enskripsyon: <strong>${safeName}</strong> (${escapeHtml(emailNorm)})</p>`);
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// =========================
// KONEKSYON
// =========================
router.post(["/login", "/connexion"], loginLimiter, async (req, res) => {
  try {
    const { email, motDePasse, password } = req.body;

    if (typeof email !== 'string' || typeof (motDePasse || password || '') !== 'string') {
      return res.status(400).json({ success: false, message: 'Champ enkòrèk' });
    }

    const mdpFinal  = motDePasse || password || '';
    const emailNorm = email.toLowerCase().trim();

    if (!emailNorm || !mdpFinal) {
      return res.status(400).json({ success: false, message: 'Champ manke' });
    }
    if (emailNorm.length > 254 || mdpFinal.length > 128) {
      return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    }
    if (!isValidEmail(emailNorm)) {
      return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });

    const ok = await user.verifierMotDePasse(mdpFinal);
    if (!ok) return res.status(401).json({ success: false, message: 'Email oswa modpas enkòrèk' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true, message: 'Koneksyon reyisi!', token,
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
    });

    // Background update — does NOT delay the response and does NOT trigger the bcrypt pre('save') hook
    user.updateOne({ lastLogin: new Date(), loginAttempts: 0 })
      .catch(err => console.error('lastLogin update error:', err.message));

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// =========================
// RESET MOT DE PASSE
// =========================
router.post("/reset-password", authStrictLimiter, async (req, res) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });
    }

    const emailNorm = rawEmail.toLowerCase().trim();
    if (!isValidEmail(emailNorm)) {
      return res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });
    }

    const user = await User.findOne({ email: emailNorm });
    if (user) {
      const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const siteUrl = process.env.SITE_URL || 'https://radio-tele-megastar.pages.dev';
      const resetUrl = `${siteUrl}/reset.html?token=${encodeURIComponent(resetToken)}`;

      envoyerEmailBackground(emailNorm, 'Reyinisyalizasyon modpas — Radio Télé Mega Star',
        `<h2>Reyinisyalizasyon modpas</h2>
         <p>Klike sou lyen sa a pou chanje modpas ou (valid pou 1 èdtan):</p>
         <a href="${escapeHtml(resetUrl)}" style="background:#cc0000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Chanje modpas mwen</a>
         <p style="color:#888;font-size:12px;">Si se pa ou ki mande sa, inyore mesaj sa a.</p>`
      );
    }

    res.json({ success: true, message: 'Email voye! Verifye bwat mail ou.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// =========================
// INIT ADMIN (TANPORÈ — EFASE APRE ITILIZASYON)
// =========================
router.post("/init-admin", authStrictLimiter, async (req, res) => {
  try {
    const { key, password } = req.body;

    // Verifye kle sekrè a
    if (!key || !process.env.ADMIN_SECRET_KEY || key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ success: false, message: 'Kle enkòrèk' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Modpas dwe gen omwen 8 karaktè' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, message: 'Modpas twò long' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.toLowerCase().trim()).filter(Boolean);
    if (!adminEmails.length) {
      return res.status(500).json({ success: false, message: 'ADMIN_EMAILS pa defini sou sèvè a' });
    }

    const emailAdmin = adminEmails[0];
    let user = await User.findOne({ email: emailAdmin });

    if (user) {
      user.motDePasse = password;
      user.role = 'admin';
      await user.save();
      return res.json({ success: true, message: `Admin mete ajou: ${emailAdmin}` });
    } else {
      await User.create({ nom: 'Admin', email: emailAdmin, motDePasse: password, telephone: '', role: 'admin' });
      return res.json({ success: true, message: `Admin kreye: ${emailAdmin}` });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

module.exports = router;
