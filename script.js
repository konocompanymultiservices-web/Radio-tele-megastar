// ============================================
// RADIO TÉLÉ MEGA STAR — SCRIPT.JS
// ============================================

const API_URL = "https://radio-megastar-backend-production.up.railway.app";

var audio = document.getElementById('audio-player');

// ============================================
// LOAD PAGE
// ============================================
window.addEventListener('load', function () {
  checkUser();

  if (audio) {
    var estateJwe = localStorage.getItem('radioJwe');
    if (estateJwe === 'wi') {
      audio.play()
        .then(function () { meteEtatPlay(); })
        .catch(function () { montreNotifikasyon(); });
    } else {
      meteEtatPause();
    }

    window.addEventListener('storage', function (e) {
      if (e.key === 'radioJwe') {
        if (e.newValue === 'wi') { audio.play(); meteEtatPlay(); }
        else { audio.pause(); meteEtatPause(); }
      }
    });
  } else {
    var estateJwe = localStorage.getItem('radioJwe');
    estateJwe === 'wi' ? meteEtatPlay() : meteEtatPause();
  }
});

// ============================================
// PLAY / PAUSE
// ============================================
function togglePlay() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().then(function() {
      localStorage.setItem('radioJwe', 'wi');
      meteEtatPlay();
    }).catch(function() {
      montreNotifikasyon();
    });
  } else {
    audio.pause();
    localStorage.setItem('radioJwe', 'non');
    meteEtatPause();
  }
}

// ============================================
// UI STATE PLAY
// ============================================
function meteEtatPlay() {
  var fi = document.getElementById('float-icon');
  if (fi) fi.textContent = '\u23F8';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'En direct'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = '\u23F8';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Pause';
}

// ============================================
// UI STATE PAUSE
// ============================================
function meteEtatPause() {
  var fi = document.getElementById('float-icon');
  if (fi) fi.textContent = '\u25B6';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'Cliquez pour écouter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = '\u25B6';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Écouter maintenant';
}

// ============================================
// VOLUME
// ============================================
function changeVolume(val) {
  if (audio) audio.volume = val;
}

// ============================================
// MENU
// ============================================
function ouvrirMenu() {
  var overlay = document.getElementById('menu-overlay');
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function fermerMenu() {
  var overlay = document.getElementById('menu-overlay');
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}

function fermerMenuOverlay(e) {
  if (e.target === document.getElementById('menu-overlay')) fermerMenu();
}

// ============================================
// MODAL ENSKRIPSYON
// ============================================
function ouvrirModal() {
  fermerMenu();
  fermerModalLogin();
  setTimeout(function () {
    var modal = document.getElementById('modal-overlay');
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }, 200);
}

function fermerModal() {
  var modal = document.getElementById('modal-overlay');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

function fermerModalOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) fermerModal();
}

// ============================================
// MODAL KONEKSYON
// ============================================
function ouvrirModalLogin() {
  fermerMenu();
  fermerModal();
  setTimeout(function () {
    var modal = document.getElementById('modal-login-overlay');
    if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }, 200);
}

function fermerModalLogin() {
  var modal = document.getElementById('modal-login-overlay');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

function fermerModalLoginOverlay(e) {
  if (e.target === document.getElementById('modal-login-overlay')) fermerModalLogin();
}

// ============================================
// ENSKRIPSYON
// ============================================
function soumettreFormulaire(e) {
  e.preventDefault();
  var form = e.target;

  var usernameInput = form.querySelector('input[name="username"]');
  var nomInput = form.querySelector('input[name="nom"]');
  var nom = usernameInput ? usernameInput.value : (nomInput ? nomInput.value : '');
  var email = form.querySelector('input[name="email"]').value;
  var phoneInput = form.querySelector('input[name="phone"]');
  var telephone = phoneInput ? phoneInput.value : '';
  var pwInput = form.querySelector('input[name="password"]') || form.querySelector('input[name="motDePasse"]');
  var motDePasse = pwInput ? pwInput.value : '';

  if (!nom || !email || !motDePasse) {
    alert('Tanpri ranpli tout champ obligatwa yo.');
    return;
  }

  var btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Chargement...'; btn.disabled = true; }

  fetch(API_URL + '/api/auth/inscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: nom, email: email, telephone: telephone, motDePasse: motDePasse })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (btn) { btn.textContent = 'Créer mon compte →'; btn.disabled = false; }
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      fermerModal();
      checkUser();
      form.reset();
      setTimeout(function() {
        if (confirm('Kont ou kreye ak siksè! Vle ale nan dashboard ou?')) {
          window.location.href = 'dashboard.html';
        }
      }, 300);
    } else {
      alert(data.message || 'Erè — eseye ankò');
    }
  })
  .catch(function() {
    if (btn) { btn.textContent = 'Créer mon compte →'; btn.disabled = false; }
    alert('Erè koneksyon ak sèvè');
  });
}

// ============================================
// KONEKSYON
// ============================================
function soumettreLogin(e) {
  e.preventDefault();
  var form = e.target;

  var email = form.querySelector('input[name="email"]').value;
  var pwInput = form.querySelector('input[name="password"]') || form.querySelector('input[name="motDePasse"]');
  var motDePasse = pwInput ? pwInput.value : '';

  var btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Connexion...'; btn.disabled = true; }

  fetch(API_URL + '/api/auth/connexion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, motDePasse: motDePasse })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (btn) { btn.textContent = 'Se connecter →'; btn.disabled = false; }
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      fermerModalLogin();
      checkUser();
      form.reset();
      setTimeout(function() {
        window.location.href = 'dashboard.html';
      }, 300);
    } else {
      alert(data.message || 'Email oswa modpas enkòrèk');
    }
  })
  .catch(function() {
    if (btn) { btn.textContent = 'Se connecter →'; btn.disabled = false; }
    alert('Erè koneksyon ak sèvè');
  });
}

// ============================================
// CHECK USER KONEKTE
// ============================================
function checkUser() {
  var token = localStorage.getItem('token');
  var userStr = localStorage.getItem('user');
  var userBar = document.getElementById('user-bar');
  var barName = document.getElementById('bar-user-name');

  if (token && userStr) {
    var user = JSON.parse(userStr);
    if (userBar) { userBar.style.display = 'flex'; userBar.style.alignItems = 'center'; userBar.style.gap = '8px'; }
    if (barName) barName.textContent = user.nom || 'Mon compte';
    var btnSignup = document.querySelector('.menu-signup');
    var btnLogin = document.querySelector('.menu-login');
    if (btnSignup) { btnSignup.textContent = 'Mon Dashboard'; btnSignup.onclick = function() { window.location.href = 'dashboard.html'; }; }
    if (btnLogin) { btnLogin.textContent = 'Déconnexion'; btnLogin.onclick = logout; }
  } else {
    if (userBar) userBar.style.display = 'none';
  }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('radioJwe');
  window.location.reload();
}

// ============================================
// CONTACT FORM
// ============================================
var contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Mèsi pou mesaj ou a! Nou pral reponn ou byento.');
    this.reset();
  });
}

// ============================================
// AUTOPLAY NOTIFICATION
// ============================================
function montreNotifikasyon() {
  var notif = document.getElementById('notif-play');
  if (notif) notif.style.display = 'flex';
}

function kontinuePlay() {
  if (audio) { audio.play(); meteEtatPlay(); }
  fermerNotif();
}

function fermerNotif() {
  var notif = document.getElementById('notif-play');
  if (notif) notif.style.display = 'none';
}

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(function (lyen) {
  lyen.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    var target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});