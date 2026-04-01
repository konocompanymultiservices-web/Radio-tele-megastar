// ============================================
// RADIO TÉLÉ MEGA STAR — SCRIPT.JS v2.0
// ============================================

const API_URL = "https://radio-megastar-backend-production.up.railway.app";
var audio = null;

// ===== INIT =====
window.addEventListener('load', function() {
  // Jwenn audio element — esansyèl pou bouton play
  audio = document.getElementById('audio-player');
  checkUser();
  initPlay();
});

// ===== BOUTON PLAY — KORIJE =====
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
  // Senkronize ant paj yo
  window.addEventListener('storage', function(e) {
    if (e.key !== 'radioJwe') return;
    if (e.newValue === 'wi') { audio.play().catch(() => {}); }
    else { audio.pause(); }
  });
}

function togglePlay() {
  audio = document.getElementById('audio-player'); // 🔥 garanti li toujou jwenn li

  if (!audio) {
    console.log("Audio pa jwenn ❌");
    return;
  }

  if (audio.paused) {
    audio.play()
      .then(() => {
        console.log("Audio ap jwe ✅");
        localStorage.setItem('radioJwe', 'wi');
        meteEtatPlay();
      })
      .catch(err => {
        console.log("Erè play:", err);
        montreNotifikasyon();
      });
  } else {
    audio.pause();
    console.log("Audio an pause ⏸️");
    localStorage.setItem('radioJwe', 'non');
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
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'Cliquez \u25BA pour \u00e9couter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = '\u25B6';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = '\u00c9couter maintenant';
  var fp = document.getElementById('float-play'); if (fp) fp.style.background = 'rgba(204,0,0,0.85)';
}

function changeVolume(val) { if (audio) audio.volume = parseFloat(val); }

function montreNotifikasyon() {
  var n = document.getElementById('notif-play'); if (n) n.style.display = 'flex';
}
function kontinuePlay() {
  if (audio) { audio.play().then(function(){localStorage.setItem('radioJwe','wi');meteEtatPlay();}).catch(()=>{}); }
  fermerNotif();
}
function fermerNotif() {
  var n = document.getElementById('notif-play'); if (n) n.style.display = 'none';
}

// ===== CAROUSEL — AUTO SLIDE + SWIPE =====
var _carIdx = 0, _carTotal = 6, _carTimer = null, _dragging = false, _startX = 0, _curX = 0;

function initCarousel() {
  var track = document.getElementById('carousel-track');
  if (!track || !track.children.length) return;

  _carTotal = Math.ceil(track.children.length / 2) || 6;

  function cardW() {
    var c = track.querySelector('.emission-card');
    if (!c) return 120;
    var st = window.getComputedStyle(c);
    return c.offsetWidth + parseFloat(st.marginRight||0) + parseFloat(st.marginLeft||0) + 16;
  }

  function goTo(idx) {
    _carIdx = ((idx % _carTotal) + _carTotal) % _carTotal;
    track.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
    track.style.transform = 'translateX(-' + (_carIdx * cardW()) + 'px)';
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
  window.addEventListener('resize', function() { goTo(_carIdx); });
  window.allerSlide = goTo;
  startAuto();
}

// ===== RECHÈCH =====
function rechercherEmission(q) {
  document.querySelectorAll('.emission-card').forEach(function(c) {
    var n = c.querySelector('.emission-name');
    if (!n) return;
    var match = !q || n.textContent.toLowerCase().includes(q.toLowerCase());
    c.style.opacity = match ? '1' : '0.2';
    c.style.transform = match ? '' : 'scale(0.9)';
  });
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

// ===== ENSKRIPSYON =====
function soumettreFormulaire(e) {
  e.preventDefault();
  var f = e.target;
  var nom = (f.querySelector('[name="username"]')||f.querySelector('[name="nom"]')||{}).value || '';
  var email = (f.querySelector('[name="email"]')||{}).value || '';
  var tel   = (f.querySelector('[name="phone"]')||{}).value || '';
  var mdp   = (f.querySelector('[name="password"]')||f.querySelector('[name="motDePasse"]')||{}).value || '';
  if (!nom||!email||!mdp) { alert('Tanpri ranpli tout champ obligatwa yo.'); return; }
  var btn = f.querySelector('button[type="submit"]');
  if (btn) { btn.textContent='Chargement...'; btn.disabled=true; }
  fetch(API_URL+'/api/auth/inscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nom,email,telephone:tel,motDePasse:mdp})})
  .then(function(r){return r.json();})
  .then(function(data){
    if(btn){btn.textContent='Cr\u00e9er mon compte \u2192';btn.disabled=false;}
    if(data.success){
      localStorage.setItem('token',data.token);
      localStorage.setItem('user',JSON.stringify(data.user));
      fermerModal(); checkUser(); f.reset();
      setTimeout(function(){
        if(confirm('Kont ou cr\u00e9\u00e9 avec succ\u00e8s! Vle ale nan dashboard ou?'))
          window.location.href = data.user.role==='admin' ? 'admin.html' : 'dashboard.html';
      },300);
    } else { alert(data.message||'Er\u00e8'); }
  }).catch(function(){if(btn){btn.textContent='Cr\u00e9er mon compte \u2192';btn.disabled=false;}alert('Er\u00e8 serveur');});
}

// ===== KONEKSYON =====
function soumettreLogin(e) {
  e.preventDefault();
  var f = e.target;
  var email = (f.querySelector('[name="email"]')||{}).value || '';
  var mdp   = (f.querySelector('[name="password"]')||f.querySelector('[name="motDePasse"]')||{}).value || '';
  var btn = f.querySelector('button[type="submit"]');
  if (btn) { btn.textContent='Connexion...'; btn.disabled=true; }
  fetch(API_URL+'/api/auth/connexion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,motDePasse:mdp})})
  .then(function(r){return r.json();})
  .then(function(data){
    if(btn){btn.textContent='Se connecter \u2192';btn.disabled=false;}
    if(data.success&&data.token){
      localStorage.setItem('token',data.token);
      localStorage.setItem('user',JSON.stringify(data.user));
      fermerModalLogin(); checkUser(); f.reset();
      setTimeout(function(){
        window.location.href = data.user.role==='admin' ? 'admin.html' : 'dashboard.html';
      },300);
    } else { alert(data.message||'Email oswa modpas enkòrèk'); }
  }).catch(function(){if(btn){btn.textContent='Se connecter \u2192';btn.disabled=false;}alert('Er\u00e8 serveur');});
}

// ===== CHECK USER — mete menu ajou =====
function checkUser() {
  var token = localStorage.getItem('token');
  var uStr  = localStorage.getItem('user');
  if (token && uStr) {
    var user = JSON.parse(uStr);
    // Mete ajou bouton menu
    var btnSignup = document.querySelector('.menu-signup');
    var btnLogin  = document.querySelector('.menu-login');
    if (btnSignup) { btnSignup.textContent='Mon Dashboard'; btnSignup.onclick=function(){window.location.href=user.role==='admin'?'admin.html':'dashboard.html';}; }
    if (btnLogin)  { btnLogin.textContent='D\u00e9connexion'; btnLogin.onclick=logout; }
  }
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('radioJwe');
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