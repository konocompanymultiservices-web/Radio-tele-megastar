const express = require('express');
const router = express.Router();

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// ===== FONKSYON MODERATION =====
async function modererMessage(message) {
  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{
          role: 'user',
          content: `Analize mesaj sa a epi bay yon sko moderation ant 0 ak 100.
100 = kontni trè ennaproprie (ensilt, spam, hèt, vyolans).
0 = kontni nòmal ak akseptab.
Reponn AK YON CHIF SÈLMAN, pa okenn eksplikasyon.

Mesaj: "${message}"`
        }],
        max_tokens: 10,
        temperature: 0
      })
    });

    const data = await response.json();
    const scoreText = data.choices?.[0]?.message?.content?.trim() || '0';
    const score = parseInt(scoreText.replace(/\D/g, '')) || 0;
    return Math.min(100, Math.max(0, score));

  } catch (err) {
    console.error('Mistral moderation error:', err.message);
    return 0; // Si API echwe, aksepte mesaj la
  }
}

// ===== FONKSYON FAQ / REPON OTOMATIK =====
async function reponFAQ(question) {
  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{
          role: 'system',
          content: `Ou se asistan pou Radio Télé Mega Star 97.3 FM an Ayiti.
Repon kesyon yo an Kreyòl oswa Fransè selon lang kesyon an.
Enfòmasyon sou radyo a:
- Frekans: 97.3 FM
- Canal: CH. 60 / Cable 116
- Streaming: https://radio-tele-megastar.pages.dev/
- Email: konocompanymultiservices@gmail.com
- Emisyon: Réveil Matinal, Actualités, Vibes Haïtiennes, Débat Citoyen, Heure Spirituelle, Soirée Mega Star
- Repon yo dwe kout (maksimòm 2-3 fraz) ak konvivyal.`
        }, {
          role: 'user',
          content: question
        }],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;

  } catch (err) {
    console.error('Mistral FAQ error:', err.message);
    return null;
  }
}

// ===== ROUTE: MODERE YON MESAJ =====
router.post('/moderer', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Mesaj requis' });
    // Limit input length to prevent prompt injection and excessive Mistral API costs
    if (typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({ success: false, message: 'Mesaj twò long (max 500 karaktè)' });
    }

    const score = await modererMessage(message);

    let action, raison;
    if (score > 90) {
      action = 'BAN';
      raison = 'Kontni trè ennaproprie';
    } else if (score > 80) {
      action = 'KACHE';
      raison = 'Kontni ennaproprie';
    } else if (score > 60) {
      action = 'AVÈTISMAN';
      raison = 'Kontni sispèk';
    } else {
      action = 'AKSEPTE';
      raison = 'Kontni akseptab';
    }

    res.json({ success: true, score, action, raison });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ===== ROUTE: FAQ OTOMATIK =====
router.post('/faq', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Kesyon requis' });
    if (typeof question !== 'string' || question.length > 500) {
      return res.status(400).json({ success: false, message: 'Kesyon twò long (max 500 karaktè)' });
    }

    const repon = await reponFAQ(question);

    if (repon) {
      res.json({ success: true, repon, source: 'mistral' });
    } else {
      res.json({
        success: true,
        repon: 'Mèsi pou kesyon ou a! Kontakte nou sou konocompanymultiservices@gmail.com pou plis enfòmasyon.',
        source: 'fallback'
      });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè sèvè' });
  }
});

// ===== ROUTE: TRADUI MESAJ =====
router.post('/tradui', async (req, res) => {
  try {
    const { texte, lang } = req.body;
    if (!texte) return res.status(400).json({ success: false, message: 'Texte requis' });
    if (typeof texte !== 'string' || texte.length > 1000) {
      return res.status(400).json({ success: false, message: 'Teks twò long (max 1000 karaktè)' });
    }

    // Whitelist allowed target languages
    const ALLOWED_LANGS = ['fr', 'ht'];
    const langCib = ALLOWED_LANGS.includes(lang) ? lang : 'fr';
    const langNon = langCib === 'fr' ? 'Fransè' : 'Kreyòl Ayisyen';

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{
          role: 'user',
          content: `Tradui teks sa a an ${langNon}. Repon ak tradiksyon sèlman, san eksplikasyon:\n\n"${texte}"`
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const tradiksyon = data.choices?.[0]?.message?.content?.trim();

    res.json({ success: true, original: texte, tradiksyon, lang: langCib });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erè tradiksyon' });
  }
});

module.exports = router;
module.exports.modererMessage = modererMessage;
