// ============================================
// SCRIPT.JS - VERSION AMÉLIORÉE v2.1
// Avec sécurité, validation, gestion erreurs
// ============================================

const API_URL = "https://radio-megastar-backend-production.up.railway.app";
var audio = null;

// ===== FONCTIONS UTILITAIRES (NEW) =====

/**
 * Valider un email
 */
function validerEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valider un mot de passe
 */
function validerMotDePasse(mdp) {
  return mdp && mdp.length >= 6;
}

/**
 * Valider un nom
 */
function validerNom(nom) {
  return nom && nom.trim().length >= 2;
}

/**
 * Afficher un Toast Notification (remplace alert())
 */
function afficherToast(message, type = 'info', duree = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  
  const styles = {
    success: { bg: '#00c851', icon: '✅' },
    error: { bg: '#cc0000', icon: '❌' },
    info: { bg: '#333', icon: 'ℹ️' },
    warning: { bg: '#ff9800', icon: '⚠️' }
  };
  
  const style = styles[type] || styles.info;
  toast.innerHTML = `<span>${message}</span>`;
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${style.bg};
    color: white;
    padding: 14px 24px;
    border-radius: 8px;
    z-index: 2000;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duree);
}

/**
 * Fetch avec timeout et meilleure gestion d'erreurs
 */
async function fetchAPI(endpoint, options = {}) {
  const timeout = options.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(API_URL + endpoint, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('⏱️ Demande expirée - connexion trop lente');
    }
    throw error;
  }
}

// ===== INIT =====
window.addEventListener('load', function() {
  audio = document.getElementById('audio-player');
  checkUser();
  initPlay();
  initPubSlider();
});

// ===== BOUTON PLAY =====
function initPlay() {
  if (!audio) return;
  
  // ✅ CHANGÉ: sessionStorage au lieu de localStorage
  var etat = sessionStorage.getItem('radioJwe');
  if (etat === 'wi') {
    audio.play()
      .then(function() { meteEtatPlay(); })
      .catch(function() { meteEtatPause(); montreNotifikasyon(); });
  } else {
    meteEtatPause();
  }
  
  audio.addEventListener('play',  meteEtatPlay);
  audio.addEventListener('pause', meteEtatPause);
  audio.addEventListener('error', function() { meteEtatPause(); });
  
  // Synchroniser entre onglets
  window.addEventListener('storage', function(e) {
    if (e.key !== 'radioJwe') return;
    if (e.newValue === 'wi') { audio.play().catch(() => {}); }
    else { audio.pause(); }
  });
}

function togglePlay() {
  audio = document.getElementById('audio-player');

  if (!audio) {
    console.log("❌ Audio non trouvé");
    return;
  }

  if (audio.paused) {
    audio.play()
      .then(() => {
        console.log("✅ Audio en lecture");
        sessionStorage.setItem('radioJwe', 'wi');  // ✅ CHANGÉ
        meteEtatPlay();
      })
      .catch(err => {
        console.log("Erreur play:", err);
        montreNotifikasyon();
      });
  } else {
    audio.pause();
    console.log("⏸️ Audio en pause");
    sessionStorage.setItem('radioJwe', 'non');  // ✅ CHANGÉ
    meteEtatPause();
  }
}

function meteEtatPlay() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = '\u23F8';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'En direct'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = '\u23F8';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = 'Pause';
  var fp = document.getElementById('float-play'); if (fp) fp.style.background = 'rgba(0,150,0,0.85)';
}

function meteEtatPause() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = '\u25B6';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'Cliquez ▶ pour écouter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = '\u25B6';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = 'Écouter maintenant';
  var fp = document.getElementById('float-play'); if (fp) fp.style.background = 'rgba(204,0,0,0.85)';
}

function changeVolume(val) { if (audio) audio.volume = parseFloat(val); }

function montreNotifikasyon() {
  var n = document.getElementById('notif-play'); if (n) n.style.display = 'flex';
}

function kontinuePlay() {
  if (audio) { 
    audio.play().then(function() {
      sessionStorage.setItem('radioJwe', 'wi');  // ✅ CHANGÉ
      meteEtatPlay();
    }).catch(() => {});
  }
  fermerNotif();
}

function fermerNotif() {
  var n = document.getElementById('notif-play'); if (n) n.style.display = 'none';
}

// ===== CAROUSEL =====
var _carIdx = 0, _carTotal = 6, _carTimer = null, _dragging = false, _startX = 0, _curX = 0;
let _cardWidthCache = null;  // ✅ NEW: Cache pour optimisation

function getCardWidth() {  // ✅ NEW: Fonction optimisée
  if (_cardWidthCache) return _cardWidthCache;
  
  const track = document.getElementById('carousel-track');
  const card = track?.querySelector('.emission-card');
  
  if (!card) return 196;
  
  _cardWidthCache = card.offsetWidth + 16;
  return _cardWidthCache;
}

function initCarousel() {
  var track = document.getElementById('carousel-track');
  if (!track || !track.children.length) return;

  _carTotal = Math.ceil(track.children.length / 2) || 6;

  function goTo(idx) {
    _carIdx = ((idx % _carTotal) + _carTotal) % _carTotal;
    track.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
    track.style.transform = 'translateX(-' + (_carIdx * getCardWidth()) + 'px)';  // ✅ CHANGÉ
    document.querySelectorAll('.carousel-dot').forEach(function(d,i){ d.classList.toggle('active', i===_carIdx); });
  }

  function next() { goTo(_carIdx + 1); }
  function startAuto() { stopAuto(); _carTimer = setInterval(next, 3000); }
  function stopAuto() { if (_carTimer) { clearInterval(_carTimer); _carTimer = null; } }

  // Touch swipe
  track.addEventListener('touchstart', function(e) { stopAuto(); _startX = e.touches[0].clientX; _dragging = true; }, {passive:true});
  track.addEventListener('touchmove', function(e) { if (_dragging) _curX = e.touches[0].clientX; }, {passive:true});
  track.addEventListener('touchend', function() {
    if (!_dragging) return; _dragging = false;
    var d = _startX - _curX;
    if (Math.abs(d) > 40) goTo(d > 0 ? _carIdx+1 : _carIdx-1);
    startAuto();
  });

  // Mouse drag
  track.addEventListener('mousedown', function(e) { stopAuto(); _startX = e.clientX; _dragging = true; track.style.cursor='grabbing'; });
  document.addEventListener('mousemove', function(e) { if (_dragging) _curX = e.clientX; });
  document.addEventListener('mouseup', function() {
    if (!_dragging) return; _dragging = false; track.style.cursor='grab';
    var d = _startX - _curX;
    if (Math.abs(d) > 40) goTo(d > 0 ? _carIdx+1 : _carIdx-1);
    startAuto();
  });

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);
  
  // ✅ NEW: Réinitialiser cache au resize
  window.addEventListener('resize', () => {
    _cardWidthCache = null;
    goTo(_carIdx);
  }, { passive: true });
  
  window.allerSlide = goTo;
  startAuto();
}

// ===== RECHERCHE (DEBOUNCE) =====
let rechercheTimer;  // ✅ NEW: Debounce timer

function rechercherEmission(q) {
  clearTimeout(rechercheTimer);
  
  rechercheTimer = setTimeout(() => {
    const query = q.toLowerCase().trim();
    
    document.querySelectorAll('.emission-card').forEach(c => {
      const nomEl = c.querySelector('.emission-name');
      if (!nomEl) return;
      
      const match = !query || nomEl.textContent.toLowerCase().includes(query);
      c.style.opacity = match ? '1' : '0.2';
      c.style.transform = match ? 'scale(1)' : 'scale(0.9)';
      c.style.transition = 'all 0.2s ease';
    });
  }, 300);  // ✅ NEW: Attendre 300ms après dernière frappe
}

// ===== MENU =====
function ouvrirMenu() { 
  var o=document.getElementById('menu-overlay'); 
  if(o){o.classList.add('open');document.body.style.overflow='hidden';} 
}

function fermerMenu() { 
  var o=document.getElementById('menu-overlay'); 
  if(o){o.classList.remove('open');document.body.style.overflow='';} 
}

function fermerMenuOverlay(e) { 
  if(e.target===document.getElementById('menu-overlay'))fermerMenu(); 
}

// ===== MODALS =====
function ouvrirModal() { 
  fermerMenu();fermerModalLogin();
  setTimeout(function(){
    var m=document.getElementById('modal-overlay');
    if(m){m.classList.add('open');document.body.style.overflow='hidden';}
  }, 200);
}

function fermerModal() { 
  var m=document.getElementById('modal-overlay');
  if(m){m.classList.remove('open');document.body.style.overflow='';} 
}

function fermerModalOverlay(e) { 
  if(e.target===document.getElementById('modal-overlay'))fermerModal(); 
}

function ouvrirModalLogin() { 
  fermerMenu();fermerModal();
  setTimeout(function(){
    var m=document.getElementById('modal-login-overlay');
    if(m){m.classList.add('open');document.body.style.overflow='hidden';}
  }, 200);
}

function fermerModalLogin() { 
  var m=document.getElementById('modal-login-overlay');
  if(m){m.classList.remove('open');document.body.style.overflow='';} 
}

function fermerModalLoginOverlay(e) { 
  if(e.target===document.getElementById('modal-login-overlay'))fermerModalLogin(); 
}

// ===== INSCRIPTION (AMÉLIORÉ) =====
async function soumettreFormulaire(e) {
  e.preventDefault();
  
  try {
    const f = e.target;
    const nom = (f.querySelector('[name="username"]')?.value || '').trim();
    const email = (f.querySelector('[name="email"]')?.value || '').trim();
    const tel = (f.querySelector('[name="phone"]')?.value || '').trim();
    const mdp = f.querySelector('[name="password"]')?.value || '';
    
    // ✅ NEW: Valider les inputs
    if (!validerNom(nom)) {
      afficherToast('❌ Le nom doit avoir au moins 2 caractères', 'error');
      return;
    }
    
    if (!validerEmail(email)) {
      afficherToast('❌ Email invalide', 'error');
      return;
    }
    
    if (!validerMotDePasse(mdp)) {
      afficherToast('❌ Le mot de passe doit avoir au moins 6 caractères', 'error');
      return;
    }
    
    const btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.textContent='⏳ Chargement...'; btn.disabled=true; }
    
    // ✅ CHANGÉ: Utiliser fetchAPI amélioré + sessionStorage
    const data = await fetchAPI('/api/auth/inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, telephone: tel, motDePasse: mdp })
    });
    
    if (data.success) {
      sessionStorage.setItem('token', data.token);  // ✅ CHANGÉ
      sessionStorage.setItem('user', JSON.stringify(data.user));  // ✅ CHANGÉ
      afficherToast('✅ Compte créé avec succès!', 'success');
      fermerModal();
      checkUser();
      f.reset();
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 1000);
    } else {
      afficherToast('❌ ' + (data.message || 'Erreur'), 'error');
    }
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    afficherToast('❌ ' + error.message, 'error');
    
  } finally {
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Créer mon compte →'; btn.disabled = false; }
  }
}

// ===== CONNEXION (AMÉLIORÉ) =====
async function soumettreLogin(e) {
  e.preventDefault();
  
  try {
    const f = e.target;
    const email = (f.querySelector('[name="email"]')?.value || '').trim();
    const mdp = f.querySelector('[name="password"]')?.value || '';
    
    // ✅ NEW: Valider
    if (!validerEmail(email)) {
      afficherToast('❌ Email invalide', 'error');
      return;
    }
    
    const btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = '⏳ Connexion...'; btn.disabled = true; }
    
    // ✅ CHANGÉ: Utiliser fetchAPI + sessionStorage
    const data = await fetchAPI('/api/auth/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse: mdp })
    });
    
    if (data.success && data.token) {
      sessionStorage.setItem('token', data.token);  // ✅ CHANGÉ
      sessionStorage.setItem('user', JSON.stringify(data.user));  // ✅ CHANGÉ
      afficherToast('✅ Connecté!', 'success');
      fermerModalLogin();
      checkUser();
      f.reset();
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 1000);
    } else {
      afficherToast('❌ Email ou mot de passe incorrect', 'error');
    }
    
  } catch (error) {
    console.error('Erreur connexion:', error);
    afficherToast('❌ ' + error.message, 'error');
    
  } finally {
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Se connecter →'; btn.disabled = false; }
  }
}

// ===== CHECK USER =====
function checkUser() {
  var token = sessionStorage.getItem('token');  // ✅ CHANGÉ
  var uStr  = sessionStorage.getItem('user');   // ✅ CHANGÉ
  if (token && uStr) {
    var user = JSON.parse(uStr);
    var btnSignup = document.querySelector('.menu-signup');
    var btnLogin  = document.querySelector('.menu-login');
    if (btnSignup) { btnSignup.textContent='Mon Dashboard'; btnSignup.onclick=function(){window.location.href=user.role==='admin'?'admin.html':'dashboard.html';}; }
    if (btnLogin)  { btnLogin.textContent='Déconnexion'; btnLogin.onclick=logout; }
  }
}

// ===== LOGOUT =====
function logout() {
  sessionStorage.removeItem('token');  // ✅ CHANGÉ
  sessionStorage.removeItem('user');   // ✅ CHANGÉ
  sessionStorage.removeItem('radioJwe');
  window.location.reload();
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var h=this.getAttribute('href');
    if(!h||h==='#')return;
    e.preventDefault();
    var t=document.querySelector(h);
    if(t)t.scrollIntoView({behavior:'smooth'});
  });
});

// ===== PUB SLIDER =====
function initPubSlider() {
  var slides = document.querySelectorAll('.pub-slide');
  if (!slides.length) return;
  var index = 0;
  setInterval(function () {
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  }, 3000);
}

// ===== MODAL MOT DE PASSE OUBLIÉ =====
function ouvrirModalOublie() {
  fermerMenu(); fermerModal(); fermerModalLogin();
  setTimeout(function(){
    var m = document.getElementById('modal-oublie-overlay');
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }, 200);
}

function fermerModalOublie() {
  var m = document.getElementById('modal-oublie-overlay');
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

async function soumettreOublie(e) {
  e.preventDefault();
  
  try {
    const email = (e.target.querySelector('[name="email"]')?.value || '').trim();
    
    if (!validerEmail(email)) {
      afficherToast('❌ Email invalide', 'error');
      return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = '⏳ Envoi...'; btn.disabled = true; }
    
    // ✅ NEW: Meilleure gestion erreurs
    const data = await fetchAPI('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (btn) { btn.textContent = '✉️ Lien envoyé!'; btn.disabled = false; }
    
    if (data.success) {
      afficherToast('✅ Vérifiez votre email!', 'success');
      setTimeout(() => fermerModalOublie(), 2000);
    } else {
      afficherToast('❌ ' + (data.message || 'Erreur'), 'error');
    }
    
  } catch (error) {
    console.error('Erreur reset password:', error);
    afficherToast('❌ ' + error.message, 'error');
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = '⚠️ Erreur'; btn.disabled = false; }
  }
}

// ===== INSCRIPTION SEPARATE (register.html) =====
async function soumettreInscription(e) {
  e.preventDefault();
  
  try {
    const f = e.target;
    const nom = (f.querySelector('[name="username"]')?.value || '').trim();
    const email = (f.querySelector('[name="email"]')?.value || '').trim();
    const tel = (f.querySelector('[name="phone"]')?.value || '').trim();
    const mdp = f.querySelector('[name="password"]')?.value || '';
    
    // ✅ NEW: Valider
    if (!validerNom(nom) || !validerEmail(email) || !validerMotDePasse(mdp)) {
      afficherToast('❌ Remplissez tous les champs correctement', 'error');
      return;
    }
    
    const btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = '⏳ Chargement...'; btn.disabled = true; }
    
    const data = await fetchAPI('/api/auth/inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, telephone: tel, motDePasse: mdp })
    });
    
    if (data.success) {
      sessionStorage.setItem('token', data.token);  // ✅ CHANGÉ
      sessionStorage.setItem('user', JSON.stringify(data.user));  // ✅ CHANGÉ
      afficherToast('✅ Compte créé!', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 1000);
    } else {
      afficherToast('❌ ' + (data.message || 'Erreur'), 'error');
    }
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    afficherToast('❌ ' + error.message, 'error');
    
  } finally {
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Créer mon compte'; btn.disabled = false; }
  }
}

// ===== LIVE CHAT =====
let chatOuvert = false;

function toggleChat() {
  chatOuvert = !chatOuvert;
  const w = document.getElementById('chat-widget');
  const t = document.getElementById('chat-toggle');
  const b = document.getElementById('chat-badge');
  if (chatOuvert) {
    w.classList.add('open');
    t.style.bottom = (340 + 16 + 28) + 'px';
    if (b) b.classList.remove('show');
  } else {
    w.classList.remove('open');
    t.style.bottom = '96px';
  }
}

function ajouterMsg(texte, type) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + type;
  div.textContent = texte;  // ✅ IMPORTANT: textContent = sûr contre XSS
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function montrerTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-typing';
  div.id = 'chat-typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function cacherTyping() {
  const t = document.getElementById('chat-typing');
  if (t) t.remove();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  ajouterMsg(msg, 'user');
  montrerTyping();

  try {
    const r = await fetchAPI('/api/mistral/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: msg })
    });
    cacherTyping();
    ajouterMsg(r.repon || 'Merci! Contactez-nous sur konocompanymultiservices@gmail.com.', 'bot');
  } catch {
    cacherTyping();
    ajouterMsg('Désolé, problème de connexion. Réessayez.', 'bot');
  }
}

// ===== PUB CLICK =====
function clicPub() {
  console.log('🎙️ Publicité cliquée');
}
