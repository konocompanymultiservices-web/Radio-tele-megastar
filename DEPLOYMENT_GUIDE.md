# 🚀 DEPLOYMENT GUIDE — RADIO TÉLÉ MEGA STAR
## Kijan Pou Lanse Update sou https://radio-tele-megastar.pages.dev/

**Date**: 2026-05-18 | **Status**: Ready for Deployment

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Local Verification (Before Push)
```bash
# 1. Verify code is clean
git status
# Should show: nothing to commit OR only intended files

# 2. Ensure .env is NOT staged
git check-ignore .env backend/.env
# Both should return the file paths (meaning they're ignored)

# 3. Test locally
npm install
cd backend && npm install

# 4. Start backend (in terminal 1)
npm run dev
# Should say: "Seve ap kouri sou po 5000"

# 5. Open index.html in browser (in terminal 2)
# OR run: npx http-server
# Test all buttons, forms, audio player
```

---

## 🌐 DEPLOYMENT ARCHITECTURE

```
Your Repository (GitHub)
    ↓
    ├─ Frontend: index.html, script.js, style.css, etc.
    │  └─ Deploy to: Netlify (https://radio-tele-megastar.pages.dev)
    │
    └─ Backend: /backend folder
       └─ Deploy to: Railway or Heroku (https://radio-megastar-backend-production.up.railway.app)
```

---

## 🔄 DEPLOYMENT PROCESS

### STEP 1: Push Code to GitHub

```bash
# 1. Add all changes
git add .

# 2. Commit
git commit -m "feat: add missing functions, fix dependencies, ready for production"

# 3. Push to main branch
git push origin main
```

**Check**: Go to https://github.com/konocompanymultiservices-web/Radio-tele-megastar
Should see your latest commit.

---

### STEP 2: Deploy Frontend to Netlify

#### Option A: Automatic Deploy (Already Configured)

If Netlify is already connected to your GitHub repo:
1. Just push code to `main` branch
2. Netlify automatically builds & deploys
3. Check build status: https://app.netlify.com/sites/radio-tele-megastar

**Wait 2-5 minutes** → Site updates automatically ✅

#### Option B: Manual Deploy

If automatic deploy not working:

```bash
# Install Netlify CLI (if not already)
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.

# Or drag & drop folder to Netlify Drop:
# https://app.netlify.com/drop
```

---

### STEP 3: Backend Environment Variables

If backend is on **Railway**:

1. Go to https://railway.app/dashboard
2. Select your project
3. Go to Variables tab
4. Add/Update these variables:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=app
JWT_SECRET=your-super-secret-key-here
MISTRAL_API_KEY=your-mistral-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAILS=admin@megastar.com,you@email.com
ADMIN_EMAIL=you@email.com
ADMIN_SECRET_KEY=your-admin-secret
SITE_URL=https://radio-tele-megastar.pages.dev
PORT=5000
```

5. Click "Save" and Railway auto-redeploys backend

---

### STEP 4: Verify Everything Works

#### Frontend Check (https://radio-tele-megastar.pages.dev/)
```
✅ Page loads
✅ Logo displays
✅ Play button works
✅ Menu opens/closes
✅ Forms visible
```

#### Backend Check
```bash
# Test API endpoint
curl https://radio-megastar-backend-production.up.railway.app/

# Should return:
# {
#   "success": true,
#   "message": "Radio Tele Mega Star API — En ligne!",
#   "version": "3.0"
# }
```

#### End-to-End Test
1. Open https://radio-tele-megastar.pages.dev/
2. Click "Créer un compte"
3. Fill form and submit
4. Should see success message
5. Check email for confirmation

---

## 🔧 TROUBLESHOOTING DEPLOYMENT

### Issue: Site shows old code

**Solution**:
```bash
# 1. Hard refresh in browser
Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

# 2. Or clear browser cache
DevTools → Network → Disable cache → Reload

# 3. Or wait 5-10 minutes for CDN cache to clear
```

### Issue: "API not found" error

**Check**:
1. Backend is running on Railway
2. API_URL in script.js is correct:
   ```javascript
   const API_URL = "https://radio-megastar-backend-production.up.railway.app";
   ```
3. CORS is configured in backend

### Issue: Forms not submitting

**Check**:
1. Backend environment variables set correctly
2. MONGODB_URI is valid
3. Network tab shows 200 status
4. Console shows no errors (F12)

### Issue: Emails not sending

**Check**:
1. EMAIL_USER and EMAIL_PASS correct
2. Gmail app password set (not regular password)
3. "Less secure apps" enabled if needed
4. Check spam folder

---

## 📊 MONITORING AFTER DEPLOYMENT

### Check Backend Logs (Railway)
1. Go to https://railway.app/dashboard
2. Select project
3. Go to Logs tab
4. Look for errors

### Check Frontend Build (Netlify)
1. Go to https://app.netlify.com
2. Select site
3. Deploys tab shows history
4. Click deploy to see build log

### Real User Monitoring
- Open DevTools (F12)
- Network tab → watch API calls
- Console tab → watch for errors

---

## 🔐 SECURITY AFTER DEPLOYMENT

### ✅ Verify Secrets NOT Exposed

```bash
# Check .env NOT in git
git log --all --full-history -- ".env"
# Should return: nothing (means .env was never committed)

# Check no secrets in code
grep -r "mongodb+srv://" backend/ --include="*.js"
# Should return: nothing (secrets only in .env)
```

### ✅ Update API_URL if Changed

If backend URL changes:
1. Edit `script.js`
2. Update `const API_URL = "..."`
3. Push to GitHub
4. Wait for Netlify to auto-deploy

---

## 📝 DEPLOYMENT CHECKLIST

Before each deployment:

- [ ] Code tested locally
- [ ] `.env` file NOT staged
- [ ] All tests passing
- [ ] No console errors
- [ ] All buttons working
- [ ] Forms submitting
- [ ] Backend environment variables set
- [ ] Commit message clear and descriptive
- [ ] Code pushed to GitHub `main` branch
- [ ] Netlify build completed successfully
- [ ] Frontend loads at https://radio-tele-megastar.pages.dev/
- [ ] Backend responds at https://radio-megastar-backend-production.up.railway.app/
- [ ] Forms connect to backend
- [ ] Emails send correctly

---

## 🚀 QUICK DEPLOYMENT SCRIPT

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🔍 Checking .env is ignored..."
git check-ignore .env

echo "✅ Adding files..."
git add .

echo "💬 Committing..."
git commit -m "Deploy: $(date)"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "⏳ Waiting for Netlify to build..."
sleep 10

echo "✅ Deployment started!"
echo "Check progress at: https://app.netlify.com/sites/radio-tele-megastar"
```

Use it:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📱 MONITOR LIVE SITE

### Real-Time Monitoring Tools

1. **Netlify Analytics**
   - https://app.netlify.com/sites/radio-tele-megastar/analytics

2. **Backend Logs**
   - https://railway.app/dashboard

3. **Error Tracking** (optional)
   - Sentry.io
   - LogRocket
   - DataDog

---

## 🎯 DEPLOYMENT SUMMARY

| Step | Platform | Time | Status |
|------|----------|------|--------|
| Push to GitHub | GitHub | 1 min | ✅ Manual |
| Build Frontend | Netlify | 2-5 min | ✅ Auto |
| Deploy Frontend | Netlify | 1 min | ✅ Auto |
| Backend Update | Railway | 2-5 min | ✅ Auto |
| Cache Clear | CloudFlare | 5-10 min | ✅ Auto |
| **TOTAL TIME** | **-** | **~10-15 min** | **✅** |

---

## ✨ AFTER SUCCESSFUL DEPLOYMENT

1. **Announce Update**
   - Email: Users subscribed to updates
   - Social: Post on your radio's pages
   - Website: Update news section

2. **Monitor Performance**
   - Check analytics daily first week
   - Monitor error logs
   - Gather user feedback

3. **Track Metrics**
   - Active users
   - API response time
   - Form submission rates
   - Email delivery

---

## 🆘 EMERGENCY ROLLBACK

If something breaks:

```bash
# Go back to previous working version
git log --oneline
# Find the commit before the broken one

git revert <commit-hash>
# Or
git reset --hard <previous-commit-hash>

git push origin main
# Netlify auto-deploys the previous version
```

---

## 📞 SUPPORT

If deployment fails:

1. **Check Netlify build logs**
   - https://app.netlify.com/sites/radio-tele-megastar/deploys

2. **Check Railway backend**
   - https://railway.app/dashboard

3. **Check GitHub Actions** (if configured)
   - https://github.com/konocompanymultiservices-web/Radio-tele-megastar/actions

4. **Debug locally**
   - `npm run dev`
   - Open DevTools
   - Check console for errors

---

**🎉 Ready to Deploy! Good luck with your update!**

Next deployment: Just `git push origin main` and Netlify does the rest! 🚀
