// ============================================
// RADIO TÉLÉ MEGA STAR — script.js
// ============================================

// Verifye si audio egziste sou paj sa a
const audio = document.getElementById('audio-player');

// ============================================
// LÈ PAJ LA CHAJE
// ============================================
window.addEventListener('load', function() {

  if (audio) {
    const estateJwe = localStorage.getItem('radioJwe');

    if (estateJwe === 'wi') {
      // Eseye jwe — si Chrome bloke li
      // montre yon ti bann ki mande pèmisyon
      audio.play().then(function() {
        // Chrome pèmèt li — jwe nòmalman
        meteEtatPlay();
      }).catch(function() {
        // Chrome bloke li — montre notifikasyon
        montreNotifikasyon();
      });
    } else {
      meteEtatPause();
    }

    // Koute chanjman localStorage
    window.addEventListener('storage', function(e) {
      if (e.key === 'radioJwe') {
        if (e.newValue === 'wi') {
          audio.play();
          meteEtatPlay();
        } else {
          audio.pause();
          meteEtatPause();
        }
      }
    });

  } else {
    const estateJwe = localStorage.getItem('radioJwe');
    if (estateJwe === 'wi') {
      meteEtatPlay();
    } else {
      meteEtatPause();
    }
  }
});

// ============================================
// NOTIFIKASYON — Mande pèmisyon jwe
// ============================================
function montreNotifikasyon() {
  // Kreye yon ti bann anwo paj la
  const bann = document.createElement('div');
  bann.id = 'notif-play';
  bann.innerHTML = `
    <span>📻 Radio te ap jwe — Klike pou kontinye koute!</span>
    <button onclick="kontinuePlay()">▶ Kontinye</button>
    <button onclick="fèmenNotif()">✕</button>
  `;
  bann.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%;
    background: var(--rouge);
    color: white;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 9999;
    font-size: 14px;
    font-weight: 700;
  `;
  bann.querySelector('button').style.cssText = `
    background: white;
    color: var(--rouge);
    border: none;
    padding: 6px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 700;
  `;
  document.body.prepend(bann);
}

function kontinuePlay() {
  audio.play();
  meteEtatPlay();
  fèmenNotif();
}

function fèmenNotif() {
  const notif = document.getElementById('notif-play');
  if (notif) notif.remove();
}

// ============================================
// TOGGLE PLAY/PAUSE
// ============================================
function togglePlay() {

  if (audio) {
    // Sou index.html — kontwole dirèkteman
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
    // Sou programmes.html — voye kòmand bay index.html
    const estateJwe = localStorage.getItem('radioJwe');
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
  if (document.getElementById('play-icon'))
    document.getElementById('play-icon').textContent = '⏸';
  if (document.getElementById('play-text'))
    document.getElementById('play-text').textContent = 'Pause';
  if (document.getElementById('stream-status')) {
    document.getElementById('stream-status').textContent = '🔴 En direct — Radio Télé Mega Star';
    document.getElementById('stream-status').style.color = '#cc0000';
  }
  if (document.getElementById('bar-play-icon'))
    document.getElementById('bar-play-icon').textContent = '⏸';
  if (document.getElementById('bar-play-text'))
    document.getElementById('bar-play-text').textContent = 'Pause';
  if (document.getElementById('bar-status')) {
    document.getElementById('bar-status').textContent = '🔴 En direct maintenant';
    document.getElementById('bar-status').style.color = '#cc0000';
  }
}

// ============================================
// ETAT PAUSE
// ============================================
function meteEtatPause() {
  if (document.getElementById('play-icon'))
    document.getElementById('play-icon').textContent = '▶';
  if (document.getElementById('play-text'))
    document.getElementById('play-text').textContent = 'Écouter maintenant';
  if (document.getElementById('stream-status')) {
    document.getElementById('stream-status').textContent = 'Cliquez pour écouter';
    document.getElementById('stream-status').style.color = '#888';
  }
  if (document.getElementById('bar-play-icon'))
    document.getElementById('bar-play-icon').textContent = '▶';
  if (document.getElementById('bar-play-text'))
    document.getElementById('bar-play-text').textContent = 'Écouter';
  if (document.getElementById('bar-status')) {
    document.getElementById('bar-status').textContent = 'En direct — 97.3 FM';
    document.getElementById('bar-status').style.color = '#888';
  }
}

// ============================================
// VOLUME
// ============================================
function changeVolume(val) {
  if (audio) audio.volume = val;
}

// ============================================
// NAVIGASYON SMOOTH
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(function(lyen) {
  lyen.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ============================================
// FÒÒM KONTAKT
// ============================================
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Merci pour votre message! Nous vous répondrons très bientôt. 🙏');
    this.reset();
  });
}