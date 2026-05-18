# Radio Télé Mega Star — v3.0

Site ofisyèl Radio Télé Mega Star 97.3 FM · CH. 60 · Cable 116

## Kijan pou mete update yo

### 1. Kopye fichye yo nan pwojè ou a

Ranplase fichye egzistan yo ak nouvo vèsyon yo:

```
index.html          → ranplase egzistan
login.html          → ranplase egzistan (te vide)
register.html       → ranplase egzistan (te vide)
style.css           → ranplase egzistan
LICENSE             → ranplase egzistan
.gitignore          → ranplase egzistan

backend/server.js          → ranplase egzistan
backend/routes/auth.js     → ranplase egzistan
backend/routes/admin.js    → ranplase egzistan
backend/routes/mistral.js  → NOUVO — ajoute li
backend/middleware/auth.js → ranplase egzistan
backend/package.json       → ranplase egzistan
backend/.env.example       → NOUVO — ajoute li
backend/.gitignore         → ranplase egzistan
```

### 2. Kreye fichye .env ou a

```bash
cd backend
cp .env.example .env
```

Louvri `.env` epi ranpli:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=kle_solid_ou_a
MISTRAL_API_KEY=kle_mistral_ou_a    ← ICI mete kle Mistral ou a
EMAIL_USER=email@gmail.com
EMAIL_PASS=mot_de_passe_app
ADMIN_EMAILS=ou@email.com
ADMIN_EMAIL=ou@email.com
ADMIN_SECRET_KEY=kle_admin_solid
SITE_URL=https://radio-tele-megastar.pages.dev
PORT=5000
```

### 3. Enstale nouvo depandans

```bash
cd backend
npm install
```

### 4. Kòmanse backend la

```bash
npm run dev    # pou devlopman
npm start      # pou pwodiksyon
```

## Kle API Mistral — Ki kote pou mete li

**Se nan `backend/.env` SÈLMAN:**
```
MISTRAL_API_KEY=kle_ou_a_isi
```

Pa janm mete kle a nan:
- Yon fichye HTML
- Yon fichye JS frontend
- GitHub (achive oubyen piblik)

## Sa ki chanje nan v3.0

### Bug korije
- Auth routes (/inscription + /connexion) kounye a match frontend
- Middleware admin gen yon vèritab verifikasyon JWT ak role
- Middleware auth.js netwaye (pa gen kòd dupliye)
- Socket.io — yon sèl koneksyon nan index.html

### Nouvo fonksyonalite
- Live Chat ak Mistral AI (FAQ otomatik, repon an Kreyòl/Fransè)
- Moderation automatik mesaj yo
- Route reset modpas kounye a fonksyonèl
- login.html ak register.html konplè (pa vide ankò)
- Design FIP miks — Noir/Blanc/Jòn ak Roboto
- Player audio entegre nan header
- Rate limiting (100 demand/minit pa IP)
- Lisans solid All Rights Reserved

## Estrikti Backend

```
/api/auth/inscription  → kreye kont
/api/auth/connexion    → konekte
/api/auth/reset-password → reset modpas
/api/admin/...         → kontni (pwoteje admin)
/api/mistral/moderer   → moderation Mistral
/api/mistral/faq       → repon FAQ otomatik
/api/mistral/tradui    → tradiksyon Kreyòl/Fransè
```

---
© 2026 Kono Company Multi Services / Radio Télé Mega Star
