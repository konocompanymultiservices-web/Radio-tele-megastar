# 🚀 KIJAN POU LANSE UPDATE NAN NET

**URL**: https://radio-tele-megastar.pages.dev/

---

## 3 ETAP SENP

### ETAP 1: Push Code sou GitHub
```bash
git add .
git commit -m "Update: new features ready"
git push origin main
```

### ETAP 2: Netlify Auto Deploy
- Netlify wè code la sou GitHub
- Li otomatikman bati & lanse site la
- **Wait 2-5 minutes** ✅

### ETAP 3: Test Site la
- Open https://radio-tele-megastar.pages.dev/
- Test tout button yo
- Test form yo
- Test audio player

---

## BACKEND UPDATES

Si backend la genyen chanjman:

1. Go sou https://railway.app/dashboard
2. Select projetè
3. Update environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - API_KEY yo
   - EMAIL PASSWORD
4. Click Save
5. Railway otomatikman redeploy

---

## VÉRIFIKASYON APRE DEPLOY

```bash
# Test frontend
curl https://radio-tele-megastar.pages.dev/
# Should see HTML page

# Test backend
curl https://radio-megastar-backend-production.up.railway.app/
# Should see JSON response
```

---

## SI GENYEN PROBLEMM

### Site montren vye code?
- Hard refresh: `Ctrl+Shift+Delete`
- Wait 5-10 minutes pou cache clear
- Check Netlify build logs

### API pa mache?
- Check backend running sou Railway
- Check environment variables set
- Check network tab (F12)

### Form pa soumèt?
- Check backend URL correct nan script.js
- Check CORS configured
- Check MongoDB connection

---

## QUICK DEPLOY

Jis fè sa:

```bash
cd /path/to/project
git add .
git commit -m "Update features"
git push origin main
```

**Done!** ✅ Netlify ap otomatikman lanse update a!

Check progress: https://app.netlify.com/sites/radio-tele-megastar

---

## TI TIPS

1. **Always test locally first**
   - `npm run dev`
   - Click buttons, test forms
   - Check console (F12) for errors

2. **Never commit .env**
   - `.env` should always be ignored
   - Use `.env.example` template

3. **Monitor after deploy**
   - Check Netlify analytics
   - Check backend logs
   - Test forms submitting

4. **Rollback if needed**
   - Go to Netlify deploys
   - Click "Rollback to previous"
   - Takes 1 minute

---

## ENVIRONMENT VARIABLES (Backend sou Railway)

```
MONGODB_URI=connection_string
JWT_SECRET=secret_key
MISTRAL_API_KEY=your_key
EMAIL_USER=email@gmail.com
EMAIL_PASS=app_password
ADMIN_EMAILS=admin@megastar.com
SITE_URL=https://radio-tele-megastar.pages.dev
```

---

**Ready to deploy?** 🚀
Just push to GitHub and wait! Netlify does the rest automatically!
