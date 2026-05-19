// ============================================
// RADIO TÃ‰LÃ‰ MEGA STAR â€” SCRIPT.JS v3.0
// ============================================

const API_URL = "https://radio-tele-megastar.onrender.com";
var audio = null;

// ===== UTILITÃˆ =====

function validerEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validerMotDePasse(mdp) { return mdp && mdp.length >= 8; }
function validerNom(nom) { return nom && nom.trim().length >= 2; }

function afficherToast(message, type, duree) {
  type = type || 'info';
  duree = duree || 3000;
  var toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  var bg = type === 'success' ? '#22c55e' : type === 'error' ? '#cc0000' : type === 'warning' ? '#f59e0b' : '#333';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:' + bg + ';color:#fff;padding:13px 24px;border-radius:8px;z-index:3000;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.35);max-width:90%;font-family:Lato,sans-serif;font-size:14px;animation:slideUp .3s ease';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, duree + 300);
}

async function fetchAPI(endpoint, options) {
  options = options || {};
  var timeout = options.timeout || 10000;
  var controller = new AbortController();
  var tid = setTimeout(function() { controller.abort(); }, timeout);
  try {
    var opts = Object.assign({}, options, { signal: controller.signal });
    delete opts.timeout;
    var r = await fetch(API_URL + endpoint, opts);
    clearTimeout(tid);
    if (!r.ok) throw new Error('Erreur HTTP ' + r.status);
    return await r.json();
  } catch(err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw new Error('Koneksyon twÃ² long â€” eseye ankÃ²');
    throw err;
  }
}

// ===== INIT =====
window.addEventListener('load', function() {
  audio = document.getElementById('audio-player');
  checkUser();
  initPlay();
  initPubSlider();
});

// ===== PLAYER =====
function initPlay() {
  if (!audio) return;
  var etat = localStorage.getItem('radioJwe');
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
  window.addEventListener('storage', function(e) {
    if (e.key !== 'radioJwe') return;
    if (e.newValue === 'wi') { audio.play().catch(function(){}); }
    else { audio.pause(); }
  });
}

function togglePlay() {
  audio = document.getElementById('audio-player');
  if (!audio) return;
  if (audio.paused) {
    audio.play()
      .then(function() { localStorage.setItem('radioJwe','wi'); meteEtatPlay(); })
      .catch(function() { montreNotifikasyon(); });
  } else {
    audio.pause();
    localStorage.setItem('radioJwe','non');
    meteEtatPause();
  }
}

function meteEtatPlay() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = 'â¸';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'En direct'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = 'â¸';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = 'Pause';
  var fp = document.getElementById('float-play'); if (fp) fp.style.background = 'rgba(0,150,0,0.85)';
}
function meteEtatPause() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = 'â–¶';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'Cliquez â–º pour Ã©couter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = 'â–¶';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = 'Ã‰couter maintenant';
  var fp = document.getElementById('float-play'); if (fp) fp.style.background = 'rgba(204,0,0,0.85)';
}
function changeVolume(val) { if (audio) audio.volume = parseFloat(val); }
function montreNotifikasyon() { var n = document.getElementById('notif-play'); if (n) n.style.display = 'flex'; }
function kontinuePlay() { if (audio) { audio.play().then(function(){localStorage.setItem('radioJwe','wi');meteEtatPlay();}).catch(function(){}); } fermerNotif(); }
function fermerNotif() { var n = document.getElementById('notif-play'); if (n) n.style.display = 'none'; }

// ===== CAROUSEL =====
var _carIdx = 0, _carTotal = 6, _carTimer = null, _dragging = false, _startX = 0, _curX = 0;
var _cardWidthCache = null;

function getCardWidth() {
  if (_cardWidthCache) return _cardWidthCache;
  var track = document.getElementById('carousel-track');
  var card  = track && track.querySelector('.emission-card');
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
    track.style.transform = 'translateX(-' + (_carIdx * getCardWidth()) + 'px)';
    document.querySelectorAll('.carousel-dot').forEach(function(d,i){ d.classList.toggle('active', i===_carIdx); });
  }

  function startAuto() { stopAuto(); _carTimer = setInterval(function(){ goTo(_carIdx + 1); }, 3000); }
  function stopAuto()  { if (_carTimer) { clearInterval(_carTimer); _carTimer = null; } }

  track.addEventListener('touchstart', function(e) { stopAuto(); _startX = e.touches[0].clientX; _dragging = true; }, {passive:true});
  track.addEventListener('touchmove',  function(e) { if (_dragging) _curX = e.touches[0].clientX; }, {passive:true});
  track.addEventListener('touchend',   function() {
    if (!_dragging) return; _dragging = false;
    if (Math.abs(_startX - _curX) > 40) goTo(_startX - _curX > 0 ? _carIdx+1 : _carIdx-1);
    startAuto();
  });
  track.addEventListener('mousedown', function(e) { stopAuto(); _startX = e.clientX; _dragging = true; track.style.cursor='grabbing'; });
  document.addEventListener('mousemove', function(e) { if (_dragging) _curX = e.clientX; });
  document.addEventListener('mouseup',   function() {
    if (!_dragging) return; _dragging = false; track.style.cursor='grab';
    if (Math.abs(_startX - _curX) > 40) goTo(_startX - _curX > 0 ? _carIdx+1 : _carIdx-1);
    startAuto();
  });
  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);
  window.addEventListener('resize', function() { _cardWidthCache = null; goTo(_carIdx); }, {passive:true});
  window.allerSlide = goTo;
  startAuto();
}

// ===== RECHÃˆCH (debounce 300ms) =====
var _rechercheTimer = null;
function rechercherEmission(q) {
  clearTimeout(_rechercheTimer);
  _rechercheTimer = setTimeout(function() {
    var query = (q || '').toLowerCase().trim();
    document.querySelectorAll('.emission-card').forEach(function(c) {
      var n = c.querySelector('.emission-name');
      if (!n) return;
      var match = !query || n.textContent.toLowerCase().includes(query);
      c.style.opacity   = match ? '1' : '0.2';
      c.style.transform = match ? '' : 'scale(0.9)';
      c.style.transition = 'all .2s ease';
    });
  }, 300);
}

// ===== MENU =====
function ouvrirMenu() { var o=document.getElementById('menu-overlay'); if(o){o.classList.add('open');document.body.style.overflow='hidden';} }
function fermerMenu() { var o=document.getElementById('menu-overlay'); if(o){o.classList.remove('open');document.body.style.overflow='';} }
function fermerMenuOverlay(e) { if(e.target===document.getElementById('menu-overlay'))fermerMenu(); }

// ===== MODALS =====
function ouvrirModal() { fermerMenu();fermerModalLogin();setTimeout(function(){var m=document.getElementById('modal-overlay');if(m){m.classList.add('open');document.body.style.overflow='hidden';}},200); }
function fermerModal() { var m=document.getElementById('modal-overlay');if(m){m.classList.remove('open');document.body.style.overflow='';} }
function fermerModalOverlay(e) { if(e.target===document.getElementById('modal-overlay'))fermerModal(); }
function ouvrirModalLogin() { fermerMenu();fermerModal();setTimeout(function(){var m=document.getElementById('modal-login-overlay');if(m){m.classList.add('open');document.body.style.overflow='hidden';}},200); }
function fermerModalLogin() { var m=document.getElementById('modal-login-overlay');if(m){m.classList.remove('open');document.body.style.overflow='';} }
function fermerModalLoginOverlay(e) { if(e.target===document.getElementById('modal-login-overlay'))fermerModalLogin(); }

// ===== ENSKRIPSYON (modal sou index.html) =====
async function soumettreFormulaire(e) {
  e.preventDefault();
  var f   = e.target;
  var nom   = (f.querySelector('[name="username"]') || {}).value || '';
  var email = (f.querySelector('[name="email"]') || {}).value || '';
  var tel   = (f.querySelector('[name="phone"]') || {}).value || '';
  var mdp   = (f.querySelector('[name="password"]') || {}).value || '';

  if (!validerNom(nom))         { afficherToast('Nom dwe gen omwen 2 karaktÃ¨', 'error'); return; }
  if (!validerEmail(email))     { afficherToast('Adresse email pa valid', 'error'); return; }
  if (!validerMotDePasse(mdp))  { afficherToast('Modpas dwe gen omwen 6 karaktÃ¨', 'error'); return; }

  var btn = f.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Chargement...'; btn.disabled = true; }

  try {
    var data = await fetchAPI('/api/auth/inscription', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nom, email, telephone:tel, motDePasse:mdp })
    });
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      afficherToast('Kont kreye ak siksÃ¨!', 'success');
      fermerModal(); checkUser(); f.reset();
      setTimeout(function() {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 1000);
    } else {
      afficherToast(data.message || 'ErÃ¨ pandan enskripsyon an', 'error');
    }
  } catch(err) {
    afficherToast(err.message || 'ErÃ¨ rezÃ²', 'error');
  } finally {
    if (btn) { btn.textContent = 'CrÃ©er mon compte â†’'; btn.disabled = false; }
  }
}

// ===== KONEKSYON (modal sou index.html) =====
async function soumettreLogin(e) {
  e.preventDefault();
  var f     = e.target;
  var email = (f.querySelector('[name="email"]') || {}).value || '';
  var mdp   = (f.querySelector('[name="password"]') || {}).value || '';

  if (!validerEmail(email)) { afficherToast('Adresse email pa valid', 'error'); return; }

  var btn = f.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Connexion...'; btn.disabled = true; }

  try {
    var data = await fetchAPI('/api/auth/connexion', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, motDePasse:mdp })
    });
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      afficherToast('Koneksyon reyisi!', 'success');
      fermerModalLogin(); checkUser(); f.reset();
      setTimeout(function() {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 800);
    } else {
      afficherToast(data.message || 'Email oswa modpas enkÃ²rÃ¨k', 'error');
    }
  } catch(err) {
    afficherToast(err.message || 'ErÃ¨ rezÃ²', 'error');
  } finally {
    if (btn) { btn.textContent = 'Se connecter â†’'; btn.disabled = false; }
  }
}

// ===== CHECK USER =====
function checkUser() {
  var token = localStorage.getItem('token');
  var uStr  = localStorage.getItem('user');
  if (token && uStr) {
    try {
      var user = JSON.parse(uStr);
      var btnSignup = document.querySelector('.menu-signup');
      var btnLogin  = document.querySelector('.menu-login');
      if (btnSignup) { btnSignup.textContent='Mon Dashboard'; btnSignup.onclick=function(){window.location.href=user.role==='admin'?'admin.html':'dashboard.html';}; }
      if (btnLogin)  { btnLogin.textContent='DÃ©connexion'; btnLogin.onclick=logout; }
    } catch(e) {}
  }
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('radioJwe');
  window.location.reload();
}

// ===== MOT DE PASSE OUBLIÃ‰ =====
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
  var email = ((e.target.querySelector('[name="email"]') || {}).value || '').trim();
  if (!validerEmail(email)) { afficherToast('Adresse email pa valid', 'error'); return; }
  var btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Envoi...'; btn.disabled = true; }
  try {
    var data = await fetchAPI('/api/auth/reset-password', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email })
    });
    if (btn) { btn.textContent = 'âœ‰ï¸ Lyen voye!'; btn.disabled = false; }
    if (data.success) { afficherToast('TchÃ¨k email ou!', 'success'); setTimeout(fermerModalOublie, 2000); }
    else              { afficherToast(data.message || 'ErÃ¨', 'error'); }
  } catch(err) {
    if (btn) { btn.textContent = 'Envoyer le lien'; btn.disabled = false; }
    afficherToast(err.message || 'ErÃ¨ rezÃ²', 'error');
  }
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
  var idx = 0;
  setInterval(function() {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 3000);
}

// ===== CHAT TOGGLE (fallback â€” index.html overrides this) =====
function toggleChat() {
  var w = document.getElementById('chat-widget');
  if (!w) return;
  w.classList.toggle('open');
}

// ===== PUB CLICK =====
function clicPub() {
  window.location.href = 'mailto:konocompanymultiservices@gmail.com?subject=PublicitÃ© Radio TÃ©lÃ© Mega Star';
}
