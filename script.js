// ============================================
// RADIO TÉLÉ MEGA STAR — script.js
// ============================================

var audio = document.getElementById('audio-player');

// ============================================
// LÈ PAJ LA CHAJE
// ============================================
window.addEventListener('load', function() {
  if (audio) {
    var estateJwe = localStorage.getItem('radioJwe');
    if (estateJwe === 'wi') {
      audio.play().then(function() {
        meteEtatPlay();
      }).catch(function() {
        montreNotifikasyon();
      });
    } else {
      meteEtatPause();
    }
    window.addEventListener('storage', function(e) {
      if (e.key === 'radioJwe') {
        if (e.newValue === 'wi') { audio.play(); meteEtatPlay(); }
        else { audio.pause(); meteEtatPause(); }
      }
    });
  } else {
    var estateJwe = localStorage.getItem('radioJwe');
    if (estateJwe === 'wi') meteEtatPlay();
    else meteEtatPause();
  }
});

// ============================================
// TOGGLE PLAY/PAUSE
// ============================================
function togglePlay() {
  if (audio) {
    if (audio.paused) {
      audio.play();
      localStorage.setItem('radioJwe', 'wi');
      meteEtatPlay();
    } else {
      audio.pause();
      localStorage.setItem('radioJwe', 'non');
      meteEtatPause();
    }
  } else {
    var estateJwe = localStorage.getItem('radioJwe');
    if (estateJwe === 'wi') {
      localStorage.setItem('radioJwe', 'non');
      meteEtatPause();
    } else {
      localStorage.setItem('radioJwe', 'wi');
      meteEtatPlay();
    }
  }
}

// ============================================
// ETAT PLAY
// ============================================
function meteEtatPlay() {
  var fi = document.getElementById('float-icon');
  if (fi) fi.textContent = '\u23F8';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'En direct — Radio Tele Mega Star'; ss.style.color = '#cc0000'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = '\u23F8';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Pause';
  var bi = document.getElementById('bar-play-icon');
  if (bi) bi.textContent = '\u23F8';
  var bt = document.getElementById('bar-play-text');
  if (bt) bt.textContent = 'Pause';
  var bs = document.getElementById('bar-status');
  if (bs) { bs.textContent = 'En direct maintenant'; bs.style.color = '#cc0000'; }
}

// ============================================
// ETAT PAUSE
// ============================================
function meteEtatPause() {
  var fi = document.getElementById('float-icon');
  if (fi) fi.textContent = '\u25B6';
  var ss = document.getElementById('stream-status');
  if (ss) { ss.textContent = 'Cliquez pour ecouter'; ss.style.color = '#aaa'; }
  var pi = document.getElementById('play-icon');
  if (pi) pi.textContent = '\u25B6';
  var pt = document.getElementById('play-text');
  if (pt) pt.textContent = 'Ecouter maintenant';
  var bi = document.getElementById('bar-play-icon');
  if (bi) bi.textContent = '\u25B6';
  var bt = document.getElementById('bar-play-text');
  if (bt) bt.textContent = 'Ecouter';
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
// MENU OVERLAY
// ============================================
function ouvrirMenu() {
  var overlay = document.getElementById('menu-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function fermerMenu() {
  var overlay = document.getElementById('menu-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function fermerMenuOverlay(e) {
  if (e.target === document.getElementById('menu-overlay')) {
    fermerMenu();
  }
}

// ============================================
// MODAL KREYE KONT
// ============================================
function ouvrirModal() {
  fermerMenu();
  setTimeout(function() {
    var modal = document.getElementById('modal-overlay');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }, 300);
}

function fermerModal() {
  var modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function fermerModalOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    fermerModal();
  }
}

function soumettreFormulaire(e) {
  e.preventDefault();

  const form = e.target;

  const username = form.querySelector('input[name="username"]').value;
  const email = form.querySelector('input[name="email"]').value;
  const password = form.querySelector('input[name="password"]').value;

  fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Repons backend:", data);

    fermerModal();

    setTimeout(() => {
      alert("Compte créé avec succès 🔥");
    }, 300);

    form.reset();
  })
  .catch(err => {
    console.error("Erreur:", err);
    alert("Erreur lors de la création du compte ❌");
  });
}

function soumettreContact(e) {
  e.preventDefault();
  alert('Merci pour votre message! Nous vous repondrons tres bientot.');
  e.target.reset();
}

// ============================================
// NOTIFIKASYON AUTOPLAY
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
// NAVIGASYON SMOOTH
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(function(lyen) {
  lyen.addEventListener('click', function(e) {
    var href = this.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    var target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ============================================
// FOMULAIRE CONTACT
// ============================================
var contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Merci pour votre message! Nous vous repondrons tres bientot.');
    this.reset();
  });
}
