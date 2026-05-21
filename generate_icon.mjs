/**
 * Radio Télé Mega Star — Icon Generator
 * Brand: Black (#000) + Yellow (#FFD600) + Red (#CC0000)
 * Run: node generate_icon.mjs
 * Requires: npm install sharp (run once in project root)
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── SVG Master (1024×1024) ──────────────────────────────────────────────────
// Design: Dark luxury radio icon — black circle, bold "MS" monogram,
// yellow star accent, red live-dot, bottom frequency text
const SVG_1024 = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <!-- Deep black background gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <!-- Yellow glow for star/accent -->
    <filter id="yellowGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Red glow for live dot -->
    <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Subtle letter glow -->
    <filter id="textGlow" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="512" cy="512" r="512" fill="url(#bgGrad)"/>

  <!-- Yellow ring border (thin, premium) -->
  <circle cx="512" cy="512" r="490" fill="none" stroke="#FFD600" stroke-width="6" stroke-opacity="0.55"/>

  <!-- Subtle yellow inner glow halo at top -->
  <ellipse cx="512" cy="320" rx="220" ry="160" fill="#FFD600" fill-opacity="0.04"/>

  <!-- ─── Main "MS" Monogram ──────────────────────────────────────────── -->
  <!-- "M" letter -->
  <text
    x="348"
    y="580"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="340"
    text-anchor="middle"
    fill="#FFFFFF"
    filter="url(#textGlow)"
    letter-spacing="-8"
  >M</text>

  <!-- "S" letter — slightly offset right, yellow accent -->
  <text
    x="688"
    y="580"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="340"
    text-anchor="middle"
    fill="#FFD600"
    filter="url(#yellowGlow)"
    letter-spacing="-8"
  >S</text>

  <!-- ─── Star accent — top center ────────────────────────────────────── -->
  <!-- 5-point star at top -->
  <polygon
    points="512,88 527,136 578,136 537,166 552,214 512,185 472,214 487,166 446,136 497,136"
    fill="#FFD600"
    filter="url(#yellowGlow)"
  />

  <!-- ─── Red live dot — top right ─────────────────────────────────────── -->
  <circle cx="820" cy="200" r="52" fill="#CC0000" filter="url(#redGlow)"/>
  <!-- "LIVE" micro-text inside dot area -->
  <text
    x="820"
    y="206"
    font-family="Arial, sans-serif"
    font-weight="700"
    font-size="28"
    text-anchor="middle"
    fill="#FFFFFF"
    dominant-baseline="middle"
  >LIVE</text>

  <!-- ─── Bottom label ──────────────────────────────────────────────────── -->
  <!-- Separator line -->
  <line x1="200" y1="650" x2="824" y2="650" stroke="#FFD600" stroke-width="2" stroke-opacity="0.3" stroke-linecap="round"/>

  <!-- Station name -->
  <text
    x="512"
    y="728"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="700"
    font-size="62"
    text-anchor="middle"
    fill="#FFFFFF"
    fill-opacity="0.90"
    letter-spacing="6"
  >MEGA STAR</text>

  <!-- Frequency -->
  <text
    x="512"
    y="798"
    font-family="Arial, sans-serif"
    font-weight="400"
    font-size="42"
    text-anchor="middle"
    fill="#FFD600"
    fill-opacity="0.80"
    letter-spacing="3"
  >97.3 FM</text>

  <!-- Bottom accent line -->
  <line x1="320" y1="840" x2="704" y2="840" stroke="#CC0000" stroke-width="3.5" stroke-opacity="0.55" stroke-linecap="round"/>
</svg>`;

// ─── SVG for small sizes (simplified, no fine detail) ────────────────────────
// At 32px and below, MS monogram reads better without the bottom text
const SVG_SMALL = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bgS" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#bgS)"/>
  <circle cx="256" cy="256" r="244" fill="none" stroke="#FFD600" stroke-width="4" stroke-opacity="0.6"/>
  <text x="174" y="312" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="190" text-anchor="middle" fill="#FFFFFF">M</text>
  <text x="344" y="312" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="190" text-anchor="middle" fill="#FFD600">S</text>
  <circle cx="420" cy="108" r="32" fill="#CC0000"/>
  <polygon points="256,30 265,58 295,58 272,75 281,103 256,87 231,103 240,75 217,58 247,58" fill="#FFD600"/>
</svg>`;

// ─── Dynamic import sharp (so we can give a helpful error if missing) ─────────
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('\n❌ Module "sharp" manke. Enstale li ak: npm install sharp\n');
  process.exit(1);
}

// ─── Output directories ───────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const ICONS_DIR = join(__dirname, 'images', 'icons');
ensureDir(ICONS_DIR);

console.log('\n🎨 Radio Télé Mega Star — Jenerasyon Ikon...\n');

// ─── PWA / Web icons ──────────────────────────────────────────────────────────
const pwaSizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];
for (const size of pwaSizes) {
  const src = size <= 96 ? SVG_SMALL : SVG_1024;
  const out = join(ICONS_DIR, `icon-${size}x${size}.png`);
  await sharp(Buffer.from(src)).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`✅ icon-${size}x${size}.png`);
}

// Master 1024×1024
await sharp(Buffer.from(SVG_1024))
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toFile(join(ICONS_DIR, 'icon-1024x1024.png'));
console.log('✅ icon-1024x1024.png (master)');

// Apple Touch Icon (180×180, no transparency for iOS)
await sharp(Buffer.from(SVG_1024))
  .resize(180, 180)
  .flatten({ background: '#000000' })
  .png()
  .toFile(join(ICONS_DIR, 'apple-touch-icon.png'));
console.log('✅ apple-touch-icon.png');

// OG / Social share image — 1200×630 with branded letterbox
const ogBg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="1200" height="4" fill="#FFD600"/>
  <rect x="0" y="626" width="1200" height="4" fill="#FFD600"/>
  <text x="600" y="160" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="110" text-anchor="middle" fill="#FFD600" letter-spacing="8">MEGA STAR</text>
  <text x="600" y="270" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="72" text-anchor="middle" fill="#FFFFFF" letter-spacing="4">RADIO TÉLÉ</text>
  <line x1="200" y1="310" x2="1000" y2="310" stroke="#FFD600" stroke-width="2" stroke-opacity="0.4"/>
  <text x="600" y="390" font-family="Arial,sans-serif" font-weight="400" font-size="52" text-anchor="middle" fill="#FFD600" fill-opacity="0.85" letter-spacing="6">97.3 FM · CH. 60 · Cable 116</text>
  <text x="600" y="490" font-family="Arial,sans-serif" font-weight="300" font-size="34" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.55" letter-spacing="2">La voix qui unit, informe et inspire Haïti</text>
  <circle cx="110" cy="315" r="24" fill="#CC0000"/>
  <circle cx="1090" cy="315" r="24" fill="#CC0000"/>
</svg>`;
await sharp(Buffer.from(ogBg))
  .resize(1200, 630)
  .png()
  .toFile(join(ICONS_DIR, 'og-image.png'));
console.log('✅ og-image.png (1200×630 réseaux sociaux)');

console.log(`\n✨ Tout ikon jenere nan: images/icons/\n`);
console.log('Mete ajou manifest.json ak HTML <link> tags pou itilize yo.\n');
