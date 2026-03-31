// ============================================
// RADIO TÉLÉ MEGA STAR — SCRIPT.JS
// ============================================

const API_URL = "https://radio-megastar-backend-production.up.railway.app";
var audio = document.getElementById('audio-player');

// ============================================
// LOAD PAGE
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
    if (btnSignup) {
      btnSignup.textContent = 'Mon Dashboard';
      btnSignup.onclick = function() {
        // KOREKSYON — verifye role!
        if (user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      };
    }
    if (btnLogin) { btnLogin.textContent = 'D\u00e9connexion'; btnLogin.onclick = logout; }
  } else {
    if (userBar) userBar.style.display = 'none';
  }
}

function meteEtatPlay() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = '\u23F8';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'En direct'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = '\u23F8';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = 'Pause';
}

function meteEtatPause() {
  var fi = document.getElementById('float-icon'); if (fi) fi.textContent = '\u25B6';
  var ss = document.getElementById('stream-status'); if (ss) { ss.textContent = 'Cliquez \u25BA pour \u00e9couter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon'); if (pi) pi.textContent = '\u25B6';
  var pt = document.getElementById('play-text'); if (pt) pt.textContent = '\u00c9couter maintenant';
}

function changeVolume(val) { if (audio) audio.volume = val; }

// ============================================
// CAROUSEL EMISYON — AUTO SLIDE + SWIPE
// ============================================
var carouselIndex = 0;
var carouselTotal = 6; // Nomb emisyon reyèl (pa duplike)
var carouselTimer = null;
var carouselDragging = false;
var carouselStartX = 0;
var carouselCurrentX = 0;

function initCarousel() {
  var track = document.getElementById('carousel-track');
  if (!track) return;

  // Kalkile konbyen kat ki vizib selon largè ekran
  function getVisible() {
    var w = window.innerWidth;
    if (w < 480) return 2;
    if (w < 768) return 3;
    if (w < 1024) return 4;
    return 6;
  }

  function getCardWidth() {
    var cards = track.querySelectorAll('.emission-card');
    if (!cards.length) return 0;
    var style = window.getComputedStyle(cards[0]);
    var margin = parseFloat(style.marginLeft || 0) + parseFloat(style.marginRight || 0);
    return cards[0].offsetWidth + margin;
  }

  function goTo(idx) {
    carouselIndex = ((idx % carouselTotal) + carouselTotal) % carouselTotal;
    var cardW = getCardWidth();
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = 'translateX(-' + (carouselIndex * cardW) + 'px)';
    updateDots();
  }

  function updateDots() {
    var dots = document.querySelectorAll('.carousel-dot');
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === carouselIndex);
    });
  }

  function nextSlide() { goTo(carouselIndex + 1); }

  function startAuto() {
    stopAuto();
    carouselTimer = setInterval(nextSlide, 3000);
  }

  function stopAuto() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
  }

  // SWIPE — Dwèt (touch) ak souris
  track.addEventListener('touchstart', function(e) {
    stopAuto();
    carouselStartX = e.touches[0].clientX;
    carouselDragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', function(e) {
    if (!carouselDragging) return;
    carouselCurrentX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', function() {
    if (!carouselDragging) return;
    carouselDragging = false;
    var diff = carouselStartX - carouselCurrentX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(carouselIndex + 1);
      else goTo(carouselIndex - 1);
    }
    startAuto();
  });

  // SWIPE ak souris tou
  track.addEventListener('mousedown', function(e) {
    stopAuto();
    carouselStartX = e.clientX;
    carouselDragging = true;
    track.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    if (!carouselDragging) return;
    carouselCurrentX = e.clientX;
  });

  document.addEventListener('mouseup', function() {
    if (!carouselDragging) return;
    carouselDragging = false;
    track.style.cursor = 'grab';
    var diff = carouselStartX - carouselCurrentX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(carouselIndex + 1);
      else goTo(carouselIndex - 1);
    }
    startAuto();
  });

  // Pause auto lè souris sou carousel
  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);

  // Expose allerSlide pou bouton dots yo
  window.allerSlide = goTo;

  // Adapte si ekran chanje gwosè
  window.addEventListener('resize', function() { goTo(carouselIndex); });

  startAuto();
}

// ============================================
// RECHÈCH EMISYON
// ============================================
function rechercherEmission(query) {
  var cards = document.querySelectorAll('.emission-card');
  if (!cards.length) return;
  var q = query.toLowerCase().trim();
  cards.forEach(function(card) {
    var name = card.querySelector('.emission-name');
    if (!name) return;
    if (!q || name.textContent.toLowerCase().includes(q)) {
      card.style.opacity = '1';
      card.style.transform = '';
    } else {
      card.style.opacity = '0.2';
      card.style.transform = 'scale(0.9)';
    }
  });
}

// ============================================
// PUBLICITE — Klike voye email
// ============================================
function contactezPourPub() {
  window.location.href = 'mailto:konocompanymultiservices@gmail.com?subject=Publicit%C3%A9%20Radio%20T%C3%A9l%C3%A9%20Mega%20Star&body=Bonjour%2C%20je%20souhaite%20annoncer%20sur%20votre%20radio.';
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
  fermerMenu(); fermerModalLogin();
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
  fermerMenu(); fermerModal();
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

  if (!nom || !email || !motDePasse) { alert('Tanpri ranpli tout champ obligatwa yo.'); return; }
  var btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Chargement...'; btn.disabled = true; }

 fetch(API_URL + '/api/auth/inscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nom,
    email,
    telephone,
    motDePasse
  })
})
.then(r => r.json())
.then(data => {

  if (btn) {
    btn.textContent = 'Créer mon compte →';
    btn.disabled = false;
  }

  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    fermerModal();
    checkUser();
    form.reset();

   if (data.user.role === 'admin') {
  window.location.href = 'admin.html';
} else {
  window.location.href = 'dashboard.html';
}
  } else {
    alert(data.message || 'Erè');
  }

})
.catch(() => {
  if (btn) {
    btn.textContent = 'Créer mon compte →';
    btn.disabled = false;
  }
  alert('Erè serveur');
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
  body: JSON.stringify({
    email,
    motDePasse
  })
})
.then(r => r.json())
.then(data => {

  if (btn) {
    btn.textContent = 'Se connecter →';
    btn.disabled = false;
  }

  if (data.success && data.token) {

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    fermerModalLogin();
    checkUser();
    form.reset();

    const user = data.user;

    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }

  } else {
    alert(data.message || 'Login incorrect');
  }

})
.catch(() => {

  if (btn) {
    btn.textContent = 'Se connecter →';
    btn.disabled = false;
  }

  alert('Erreur serveur');
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
    if (btnLogin) { btnLogin.textContent = 'D\u00e9connexion'; btnLogin.onclick = logout; }
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
