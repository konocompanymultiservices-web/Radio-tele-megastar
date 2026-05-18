# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Backend (run from `backend/` directory):**
```bash
npm run dev     # development with nodemon (auto-restart)
npm start       # production
```

**Create admin account manually:**
```bash
node backend/createadmin.js
```

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Environment setup:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Then fill in values in backend/.env
```

There are no tests, no build steps, and no frontend package.json — the frontend is plain HTML/CSS/JS served statically.

## Architecture

### Frontend (root directory)
Static files served by Netlify. No framework, no bundler.

- **Public pages** (`index.html`, `about.html`, `contact.html`, `programmes.html`): share `style.css` and `script.js`
- **Auth pages** (`login.html`, `register.html`): inline styles, call `/api/auth/*`
- **Dashboards** (`dashboard.html`, `admin.html`): fully self-contained — all CSS and JS is embedded inline; they do NOT use `script.js` or `style.css`

`script.js` handles the live radio player, public page nav, slides/news/schedule fetched from the API, and Socket.io online counter. `API_URL` is hardcoded at the top of `script.js` to the Railway backend URL.

### Backend (`backend/`)
Express + MongoDB (Mongoose) + Socket.io on Railway.

```
server.js               — entry: CORS, rate-limit, Socket.io, MongoDB, route mounts
routes/auth.js          — POST /api/auth/signup|inscription, /login|connexion, /reset-password
routes/User.js          — GET/PUT /api/user/profil, GET /api/user/dashboard  (auth required)
routes/admin.js         — all /api/admin/* routes (adminAuth required)
routes/mistral.js       — POST /api/mistral/moderer, /faq, /tradui
middleware/auth.js      — JWT Bearer token → attaches req.user
models/User.js          — User schema (nom, email, motDePasse, role, plan, statistiques)
models/Content.js       — News, Emission, Publicite, Animateur, Reportage, Online schemas
```

### Auth flow
- JWT signed with `JWT_SECRET`, 7-day expiry, stored in `localStorage` on the frontend
- **User role** is set at registration: if the email is in `ADMIN_EMAILS` env var → role `admin`, otherwise `user`
- **Regular routes** use `middleware/auth.js` (Bearer token → `req.user`)
- **Admin routes** use a local `adminAuth` function in `routes/admin.js` that accepts either a Bearer JWT with `role=admin` OR the `x-admin-key` header matching `ADMIN_SECRET_KEY`
- The `admin.html` login screen validates against `/api/auth/connexion` and checks `user.role === 'admin'` client-side

### Socket.io
The `io` instance is attached to every request as `req.io` via middleware in `server.js`. Online listener count is tracked in memory (`onlineUsers`) and also persisted to the `Online` MongoDB collection via `/api/admin/online/ping`.

### Key env vars (backend/.env)
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signs all tokens |
| `ADMIN_EMAILS` | Comma-separated emails that get `role=admin` on signup |
| `ADMIN_SECRET_KEY` | Bypass header for internal admin API calls |
| `MISTRAL_API_KEY` | Mistral AI (moderation, FAQ, translation) |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP for welcome/reset emails |
| `SITE_URL` | Used in password reset email links |

### Deployment
- **Frontend** → Netlify, auto-deploys on push to `main` (no build command, publishes root)
- **Backend** → Railway, auto-deploys on push to `main`, runs `npm start`
- Frontend Netlify URL: `https://radio-tele-megastar.pages.dev/`
- Backend Railway URL: `https://radio-megastar-backend-production.up.railway.app`
