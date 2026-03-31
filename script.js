// ============================================
// RADIO TÃ‰LÃ‰ MEGA STAR â€” SCRIPT KORIJE
// ============================================

const API_URL = "https://radio-megastar-backend-production.up.railway.app"; // â† chanje ak URL Railway ou a
// const API_URL = "http://localhost:5000"; // â† itilize sa pou tÃ¨s lokal

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
    audio.play();
    localStorage.setItem('radioJwe', 'wi');
    meteEtatPlay();
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
  if (fi) fi.textContent = 'â¸';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'En direct â€” Radio Tele Mega Star'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = 'â¸';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Pause';
  var bi = document.getElementById('bar-play-icon');
  if (bi) bi.textContent = 'â¸';
  var bt = document.getElementById('bar-play-text');
  if (bt) bt.textContent = 'Pause';
  var bs = document.getElementById('bar-status');
  if (bs) { bs.textContent = 'En direct maintenant'; bs.style.color = '#cc0000'; }
}

// ============================================
// UI STATE PAUSE
// ============================================
function meteEtatPause() {
  var fi = document.getElementById('float-icon');
  if (fi) fi.textContent = 'â–¶';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'Cliquez pour Ã©couter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = 'â–¶';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Ã‰couter maintenant';
  var bi = document.getElementById('bar-play-icon');
  if (bi) bi.textContent = 'â–¶';
  var bt = document.getElementById('bar-play-text');
  if (bt) bt.textContent = 'Ã‰couter';
  var bs = document.getElementById('bar-status');
  if (bs) { bs.textContent = 'En direct - 97.3 FM'; bs.style.color = '#888'; }
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
// MODAL REGISTER
// ============================================
function ouvrirModal() {
  fermerMenu();
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
// ENSKRIPSYON (REGISTER)
// ============================================
function soumettreFormulaire(e) {
  e.preventDefault();
  const form = e.target;

  const nom = form.querySelector('input[name="username"]') 
    ? form.querySelector('input[name="username"]').value 
    : form.querySelector('input[name="nom"]').value;
  const email = form.querySelector('input[name="email"]').value;
  const telephone = form.querySelector('input[name="phone"]') 
    ? form.querySelector('input[name="phone"]').value 
    : '';
  const motDePasse = form.querySelector('input[name="password"]') 
    ? form.querySelector('input[name="password"]').value 
    : form.querySelector('input[name="motDePasse"]').value;

  // Montre loading
  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Chargement...'; btn.disabled = true; }

  fetch(`${API_URL}/api/auth/inscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, email, telephone, motDePasse })
  })
  .then(res => res.json())
  .then(data => {
    if (btn) { btn.textContent = 'CrÃ©er mon compte â†’'; btn.disabled = false; }

    if (data.success) {
      // Sove token ak info user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      fermerModal();
      checkUser(); // Mete ajou UI

      setTimeout(() => {
        alert(`Bienvenue ${data.user.nom}! Kont ou kreye ak siksÃ¨ ðŸ”¥`);
      }, 300);

      form.reset(); window.location.href = 'dashboard.html'; window.location.href = 'dashboard.html';
    } else {
      alert(data.message || "ErÃ¨ â€” eseye ankÃ² âŒ");
    }
  })
  .catch(err => {
    if (btn) { btn.textContent = 'CrÃ©er mon compte â†’'; btn.disabled = false; }
    console.error("Erreur enskripsyon:", err);
    alert("ErÃ¨ koneksyon ak sÃ¨vÃ¨ âŒ");
  });
}

// ============================================
// KONEKSYON (LOGIN)
// ============================================
function soumettreLogin(e) {
  e.preventDefault();
  const form = e.target;

  const email = form.querySelector('input[name="email"]').value;
  const motDePasse = form.querySelector('input[name="password"]') 
    ? form.querySelector('input[name="password"]').value 
    : form.querySelector('input[name="motDePasse"]').value;

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.textContent = 'Connexion...'; btn.disabled = true; }

  fetch(`${API_URL}/api/auth/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, motDePasse })
  })
  .then(res => res.json())
  .then(data => {
    if (btn) { btn.textContent = 'Se connecter â†’'; btn.disabled = false; }

    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      checkUser(); // Mete ajou UI

      alert(`Koneksyon reyisi! Bonjou ${data.user.nom} ðŸ”¥`);
      window.location.reload();
    } else {
      alert(data.message || "Email oswa modpas enkÃ²rÃ¨k âŒ");
    }
  })
  .catch(err => {
    if (btn) { btn.textContent = 'Se connecter â†’'; btn.disabled = false; }
    console.error("Erreur koneksyon:", err);
    alert("ErÃ¨ koneksyon ak sÃ¨vÃ¨ âŒ");
  });
}

// ============================================
// VERIFIKASYON USER KONEKTE
// ============================================
function checkUser() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  const btnCreer = document.getElementById("btn-creer-compte");
  const btnConnecter = document.getElementById("btn-connecter");
  const btnMonCompte = document.getElementById("btn-mon-compte");

  if (token && userStr) {
    const user = JSON.parse(userStr);

    // Kache bouton enskripsyon/koneksyon, montre "Mon compte"
    if (btnCreer) btnCreer.style.display = 'none';
    if (btnConnecter) btnConnecter.style.display = 'none';
    if (btnMonCompte) { btnMonCompte.style.display = 'inline-block'; btnMonCompte.textContent = `ðŸ‘¤ ${user.nom}`; }

    console.log("User konekte:", user.nom);
  } else {
    if (btnCreer) btnCreer.style.display = 'inline-block';
    if (btnConnecter) btnConnecter.style.display = 'inline-block';
    if (btnMonCompte) btnMonCompte.style.display = 'none';
  }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("Ou dekonekte!");
  window.location.reload();
}

// ============================================
// CONTACT FORM
// ============================================
var contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('MÃ¨si pou mesaj ou a! Nou pral reponn ou byento.');
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



