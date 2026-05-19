# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Radio Télé Mega Star** is a modern, responsive web platform for a Haitian radio station (97.3 FM) serving both listeners and administrators. The platform enables users to:
- Listen to live streams
- Browse and view detailed show profiles (Émissions)
- User accounts with personalization and subscription plans
- Admin dashboard for content management
- Like/follow shows and track schedules
- Real-time online listener count via Socket.io

## Tech Stack

- **Frontend**: Plain HTML5 + CSS3 + Vanilla JavaScript (no framework, no bundler)
- **Styling**: Custom CSS with design system variables (CSS custom properties)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: JWT (7-day expiry, stored in localStorage)
- **Real-time**: Socket.io (online counter)
- **AI**: Mistral API (moderation, FAQ, translation)
- **Deploy**: Netlify (frontend) + Railway (backend)

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

## Project Structure

```
root/
├── index.html              # Home page
├── about.html              # About page
├── contact.html            # Contact page
├── programmes.html         # Shows listing page
├── login.html              # Auth: login
├── register.html           # Auth: registration
├── dashboard.html          # User dashboard (self-contained)
├── admin.html              # Admin dashboard (self-contained)
├── style.css               # Shared design system (public pages only)
├── script.js               # Shared JS: player, nav, API calls, Socket.io
└── backend/
    ├── server.js           # Entry: CORS, rate-limit, Socket.io, MongoDB, routes
    ├── routes/
    │   ├── auth.js         # POST /api/auth/signup|inscription, /login|connexion, /reset-password
    │   ├── User.js         # GET/PUT /api/user/profil, GET /api/user/dashboard (auth required)
    │   ├── admin.js        # All /api/admin/* routes (adminAuth required)
    │   └── mistral.js      # POST /api/mistral/moderer, /faq, /tradui
    ├── middleware/
    │   └── auth.js         # JWT Bearer token → attaches req.user
    └── models/
        ├── User.js         # User schema (nom, email, motDePasse, role, plan, statistiques)
        └── Content.js      # News, Emission, Publicite, Animateur, Reportage, Online schemas
```

## Architecture

### Frontend (root directory)
Static files served by Netlify. No framework, no bundler.

- **Public pages** (`index.html`, `about.html`, `contact.html`, `programmes.html`): share `style.css` and `script.js`
- **Auth pages** (`login.html`, `register.html`): inline styles, call `/api/auth/*`
- **Dashboards** (`dashboard.html`, `admin.html`): fully self-contained — all CSS and JS embedded inline; do NOT use `script.js` or `style.css`

`script.js` handles: live radio player, public page nav, slides/news/schedule fetched from API, Socket.io online counter. `API_URL` is hardcoded at the top of `script.js` to the Railway backend URL.

### Backend (`backend/`)
Express + MongoDB (Mongoose) + Socket.io on Railway.

### Auth flow
- JWT signed with `JWT_SECRET`, 7-day expiry, stored in `localStorage` on the frontend
- **User role** set at registration: if email is in `ADMIN_EMAILS` env var → role `admin`, otherwise `user`
- **Regular routes** use `middleware/auth.js` (Bearer token → `req.user`)
- **Admin routes** use a local `adminAuth` function in `routes/admin.js` that accepts either a Bearer JWT with `role=admin` OR the `x-admin-key` header matching `ADMIN_SECRET_KEY`
- The `admin.html` login screen validates against `/api/auth/connexion` and checks `user.role === 'admin'` client-side

### Database Schema (MongoDB)
- **User**: nom, email, motDePasse (bcrypt), role, plan, statistiques
- **Emission**: titre, description, horaire, animateur, image, likes
- **News**: titre, contenu, image, date
- **Animateur**: nom, bio, photo, reseauxSociaux
- **Publicite**: titre, image, lien, actif
- **Reportage**: titre, contenu, image, date
- **Online**: count, updatedAt (persisted every 5s from Socket.io)

### Socket.io
The `io` instance is attached to every request as `req.io` via middleware in `server.js`. Online listener count tracked in memory (`onlineUsers`), debounce-persisted to `Online` MongoDB collection every 5 seconds.

### Key env vars (backend/.env)
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signs all tokens (min 32 chars) |
| `ADMIN_EMAILS` | Comma-separated emails that get `role=admin` on signup |
| `ADMIN_SECRET_KEY` | Bypass header for internal admin API calls |
| `MISTRAL_API_KEY` | Mistral AI (moderation, FAQ, translation) |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP for welcome/reset emails |
| `SITE_URL` | Used in password reset email links |

### Deployment
- **Frontend** → Netlify, auto-deploys on push to `main` (no build command, publishes root)
- **Backend** → Railway, auto-deploys on push to `main`, runs `npm start`
- Frontend URL: `https://radio-tele-megastar.pages.dev/`
- Backend URL: `https://radio-tele-megastar.onrender.com`

## Design System

Follow these rules strictly when editing any CSS or HTML:

- **Colors**: Black/Yellow brand (`--nwa: #000`, `--jaune: #FFD600`, `--rouge: #CC0000`, `--blan: #fff`). Use CSS variables defined in `style.css :root` — never hardcode hex values.
- **Typography**: Max 3 font weights. Body line-height: 150%. Heading line-height: 120%. Fonts: Roboto (body), Oswald (headings/labels), Lato (forms).
- **Spacing**: 8px system — all margins/padding must be multiples of 8px (8, 16, 24, 32, 40, 48...).
- **Responsive**: Mobile-first. Breakpoints: 480px, 768px, 1024px, 1280px. Stack vertically on mobile, flex/grid horizontally on desktop.
- **Touch targets**: Buttons and interactive elements minimum 44×44px on mobile.
- **Animations**: Subtle only — `transition: all .2s ease` on hover. No heavy keyframe animations.
- **Icons**: Use Unicode symbols or inline SVG — no external icon libraries.
- **Images**: Use `loading="lazy"` on all `<img>` tags. Always include `alt` attributes.

## Component Patterns (Vanilla JS)

Organize JavaScript following these conventions:
- **Page-level logic** in `<script>` tags at bottom of each HTML file
- **Reusable utilities** in `script.js` (public pages) or top of inline `<script>` (dashboards)
- **All async operations** wrapped in `try/catch` with user-visible feedback (toast or error message)
- **Loading states**: show a spinner or disable button during API calls, re-enable on completion
- **Error handling**: never show raw error objects to users — show translated Creole/French messages

## Common Development Tasks

### Adding a New Content Type
1. Create Mongoose schema in `backend/models/Content.js`
2. Add CRUD routes in `backend/routes/admin.js` (protected by `adminAuth`)
3. Add public read route in appropriate route file
4. Update admin.html to display and manage the new content
5. Update public pages if needed to display the content

### Adding a New API Endpoint
1. Add route in appropriate `backend/routes/*.js` file
2. Apply `authMiddleware` for user-protected routes
3. Apply `adminAuth` for admin-only routes
4. Validate all inputs before processing
5. Return consistent `{ success: true/false, message, data }` shape

### Editing Public Page Styles
1. Always edit `style.css` — never add `<style>` tags to public HTML pages
2. Use existing CSS variables — never hardcode colors or fonts
3. Follow the 8px spacing system
4. Test at 375px (mobile), 768px (tablet), 1440px (desktop)

### Editing Dashboard Styles
1. Dashboard CSS is embedded inline in `dashboard.html` and `admin.html`
2. Use the same CSS variable names as `style.css` for consistency

## Security Checklist

Apply these rules on every backend change:

- [ ] Never expose `ADMIN_SECRET_KEY` or `JWT_SECRET` in frontend code
- [ ] Validate and sanitize all user inputs (length, type, format) before DB operations
- [ ] Use `middleware/auth.js` on all user-protected routes
- [ ] Use `adminAuth` on all admin-only routes
- [ ] Never return stack traces or internal error details to clients
- [ ] Rate limiting applied: 100 req/min global, 10 req/15min for auth routes
- [ ] Passwords hashed with bcrypt (rounds: 12) — never store plaintext
- [ ] Password minimum: 8 characters (both frontend validation AND backend enforcement)
- [ ] JWT expiry: 7 days — no refresh tokens needed for this scale
- [ ] CORS: only allow listed origins (never `*` in production)
- [ ] Security headers set: X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy

## Testing Checklist Before Deployment

Run through this list before every `git push`:

**Authentication**
- [ ] Signup works with valid data, rejects invalid email/short password
- [ ] Login works, returns JWT, redirects correctly
- [ ] Logout clears localStorage and redirects to home
- [ ] Password reset email sends and link works

**Public Pages**
- [ ] Radio player plays/pauses, volume works
- [ ] Online counter updates via Socket.io
- [ ] News, shows, schedule load from API
- [ ] Contact form submits without errors

**User Dashboard**
- [ ] Profile loads with correct user data
- [ ] Profile edits save correctly
- [ ] Subscription plan displays correctly

**Admin Dashboard**
- [ ] Admin login works (role check)
- [ ] Can create/edit/delete shows (Émissions)
- [ ] Can create/edit/delete news
- [ ] Can manage animateurs
- [ ] Stats page shows real online count

**Responsive / Visual**
- [ ] No layout breaks at 375px, 768px, 1024px, 1440px
- [ ] Buttons are touch-friendly (≥44px)
- [ ] No console errors in browser DevTools
- [ ] Build (if any) completes without warnings

## Performance Best Practices

- Use `loading="lazy"` on all images
- Minimize inline `<script>` — keep reusable logic in `script.js`
- Debounce Socket.io MongoDB writes (already implemented: 5s debounce)
- Avoid `document.write()` — use DOM manipulation methods
- Cache API responses in memory where appropriate (e.g., show list)
- Keep `backend/` dependencies minimal — no library if native Node.js does the job
