/**
 * FreshCart AI — High-Fidelity Quick-Commerce SVG Asset Library Builder
 * (scripts/build-asset-library.js)
 * 
 * Generates crisp, lightweight, production-grade vector SVG graphics
 * for all canonical product families and category departments.
 * Stored locally in public/images/ for 100% offline, zero-CDN performance.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'images', 'products');
const CATEGORIES_DIR = path.join(__dirname, '..', 'public', 'images', 'categories');
const ROOT_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

function svgWrapper(bgGrad, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgGrad}
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="200" height="200" rx="28" fill="url(#bgGrad)"/>
  <g filter="url(#dropShadow)">
    ${content}
  </g>
</svg>`;
}

// Visual definitions for all 75 product family SVGs
const PRODUCT_SVGS = {
  'fresh-apples': svgWrapper(
    '<stop offset="0%" stop-color="#fee2e2"/><stop offset="100%" stop-color="#fecaca"/>',
    `<circle cx="85" cy="112" r="42" fill="#ef4444"/>
     <circle cx="115" cy="112" r="42" fill="#dc2626"/>
     <ellipse cx="100" cy="120" rx="36" ry="38" fill="#b91c1c"/>
     <ellipse cx="80" cy="96" rx="12" ry="24" fill="#fca5a5" opacity="0.6" transform="rotate(-20 80 96)"/>
     <!-- Stem and Leaf -->
     <path d="M100,74 C100,56 108,46 114,42" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/>
     <path d="M104,58 C120,48 136,54 134,68 C120,68 108,64 104,58 Z" fill="#22c55e"/>`
  ),

  'fresh-bananas': svgWrapper(
    '<stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#fef08a"/>',
    `<path d="M48,142 C70,165 130,165 158,110 C162,102 152,98 146,104 C122,145 78,145 56,128 Z" fill="#eab308"/>
     <path d="M42,130 C65,155 125,158 152,98 C156,90 146,86 140,92 C116,135 72,135 50,116 Z" fill="#facc15"/>
     <path d="M38,118 C60,145 120,150 148,88 C152,80 142,76 136,82 C112,125 68,125 46,106 Z" fill="#fde047"/>
     <path d="M148,88 L158,78 C160,76 156,72 152,74 L142,84 Z" fill="#65a30d"/>
     <circle cx="39" cy="119" r="3" fill="#713f12"/>`
  ),

  'juicy-oranges': svgWrapper(
    '<stop offset="0%" stop-color="#ffedd5"/><stop offset="100%" stop-color="#fed7aa"/>',
    `<circle cx="100" cy="112" r="50" fill="#f97316"/>
     <circle cx="100" cy="112" r="46" fill="#fb923c"/>
     <ellipse cx="80" cy="92" rx="14" ry="26" fill="#fdba74" opacity="0.6" transform="rotate(-30 80 92)"/>
     <circle cx="100" cy="62" r="5" fill="#15803d"/>
     <path d="M100,62 C116,48 135,52 136,66 C122,68 110,66 100,62 Z" fill="#22c55e"/>`
  ),

  'fresh-mangoes': svgWrapper(
    '<stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>',
    `<path d="M96,62 C135,62 155,95 145,135 C136,168 95,165 75,145 C55,125 65,65 96,62 Z" fill="#f59e0b"/>
     <path d="M90,66 C115,66 130,85 125,120 C120,145 90,142 78,128 C64,112 72,70 90,66 Z" fill="#fbbf24"/>
     <ellipse cx="78" cy="88" rx="8" ry="18" fill="#fef08a" opacity="0.6" transform="rotate(-20 78 88)"/>
     <path d="M96,62 C96,48 102,40 108,36" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/>
     <path d="M100,48 C115,38 130,42 128,54 C116,55 106,52 100,48 Z" fill="#16a34a"/>`
  ),

  'sweet-strawberries': svgWrapper(
    '<stop offset="0%" stop-color="#ffe4e6"/><stop offset="100%" stop-color="#fecdd3"/>',
    `<path d="M100,160 C65,130 55,95 72,76 C88,58 112,58 128,76 C145,95 135,130 100,160 Z" fill="#e11d48"/>
     <!-- Seeds -->
     <circle cx="85" cy="88" r="2" fill="#fef08a"/>
     <circle cx="115" cy="88" r="2" fill="#fef08a"/>
     <circle cx="100" cy="104" r="2" fill="#fef08a"/>
     <circle cx="82" cy="120" r="2" fill="#fef08a"/>
     <circle cx="118" cy="120" r="2" fill="#fef08a"/>
     <circle cx="100" cy="136" r="2" fill="#fef08a"/>
     <!-- Calyx -->
     <path d="M100,66 L92,50 L100,56 L108,50 Z" fill="#16a34a"/>
     <path d="M85,68 L70,58 L82,62 Z" fill="#22c55e"/>
     <path d="M115,68 L130,58 L118,62 Z" fill="#22c55e"/>`
  ),

  'green-grapes': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<g fill="#84cc16">
      <circle cx="100" cy="80" r="14"/>
      <circle cx="80" cy="94" r="14"/>
      <circle cx="100" cy="96" r="14"/>
      <circle cx="120" cy="94" r="14"/>
      <circle cx="70" cy="115" r="13"/>
      <circle cx="90" cy="116" r="13"/>
      <circle cx="110" cy="116" r="13"/>
      <circle cx="130" cy="115" r="13"/>
      <circle cx="82" cy="136" r="12"/>
      <circle cx="100" cy="138" r="12"/>
      <circle cx="118" cy="136" r="12"/>
      <circle cx="92" cy="154" r="11"/>
      <circle cx="108" cy="154" r="11"/>
      <circle cx="100" cy="168" r="9"/>
     </g>
     <path d="M100,74 C100,52 112,42 120,38" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/>
     <path d="M104,56 C124,44 140,54 136,68 C120,68 110,64 104,56 Z" fill="#4d7c0f"/>`
  ),

  'fresh-papaya': svgWrapper(
    '<stop offset="0%" stop-color="#ffedd5"/><stop offset="100%" stop-color="#fed7aa"/>',
    `<path d="M96,52 C130,52 150,90 142,136 C134,170 95,168 76,146 C56,124 64,52 96,52 Z" fill="#ea580c"/>
     <path d="M96,62 C120,62 135,90 128,126 C122,152 95,150 82,134 C68,118 72,62 96,62 Z" fill="#f97316"/>
     <ellipse cx="98" cy="108" rx="16" ry="32" fill="#451a03"/>
     <circle cx="96" cy="98" r="2.5" fill="#1c1917"/>
     <circle cx="102" cy="106" r="2.5" fill="#1c1917"/>
     <circle cx="94" cy="116" r="2.5" fill="#1c1917"/>`
  ),

  'fresh-watermelon': svgWrapper(
    '<stop offset="0%" stop-color="#fee2e2"/><stop offset="100%" stop-color="#fecaca"/>',
    `<path d="M36,130 C45,165 155,165 164,130 Z" fill="#15803d"/>
     <path d="M42,128 C52,158 148,158 158,128 Z" fill="#ecfdf5"/>
     <path d="M48,126 C56,152 144,152 152,126 Z" fill="#ef4444"/>
     <circle cx="75" cy="134" r="2.5" fill="#18181b"/>
     <circle cx="95" cy="140" r="2.5" fill="#18181b"/>
     <circle cx="108" cy="134" r="2.5" fill="#18181b"/>
     <circle cx="125" cy="138" r="2.5" fill="#18181b"/>`
  ),

  'fresh-pomegranate': svgWrapper(
    '<stop offset="0%" stop-color="#ffe4e6"/><stop offset="100%" stop-color="#fecdd3"/>',
    `<circle cx="100" cy="115" r="48" fill="#be123c"/>
     <!-- Crown -->
     <path d="M90,68 L94,54 L100,62 L106,54 L110,68 Z" fill="#9f1239"/>
     <!-- Cut revealing arils -->
     <path d="M100,85 C124,85 138,102 135,124 C132,145 110,150 95,142 C82,132 82,95 100,85 Z" fill="#fda4af"/>
     <circle cx="102" cy="102" r="4" fill="#881337"/>
     <circle cx="114" cy="106" r="4" fill="#881337"/>
     <circle cx="124" cy="116" r="4" fill="#881337"/>
     <circle cx="106" cy="116" r="4" fill="#881337"/>
     <circle cx="116" cy="126" r="4" fill="#881337"/>
     <circle cx="100" cy="128" r="4" fill="#881337"/>`
  ),

  'fresh-guava': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#bbf7d0"/>',
    `<circle cx="100" cy="112" r="48" fill="#65a30d"/>
     <ellipse cx="80" cy="94" rx="12" ry="24" fill="#84cc16" opacity="0.6" transform="rotate(-25 80 94)"/>
     <circle cx="100" cy="64" r="5" fill="#4d7c0f"/>
     <path d="M100,64 C115,52 130,55 132,66 C120,68 110,66 100,64 Z" fill="#15803d"/>`
  ),

  'fresh-pineapple': svgWrapper(
    '<stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#fef08a"/>',
    `<ellipse cx="100" cy="125" rx="38" ry="48" fill="#d97706"/>
     <!-- Crown -->
     <path d="M100,80 L90,40 L100,56 L110,40 Z" fill="#15803d"/>
     <path d="M88,82 L72,48 L86,64 Z" fill="#16a34a"/>
     <path d="M112,82 L128,48 L114,64 Z" fill="#16a34a"/>
     <!-- Diamond hatch lines -->
     <path d="M72,105 L128,145 M65,125 L120,165 M82,90 L135,130" stroke="#78350f" stroke-width="2" opacity="0.5"/>
     <path d="M128,105 L72,145 M135,125 L80,165 M118,90 L65,130" stroke="#78350f" stroke-width="2" opacity="0.5"/>`
  ),

  'fresh-avocado': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<path d="M100,50 C125,50 145,85 140,128 C135,165 105,168 85,152 C65,135 60,110 70,85 C78,65 88,50 100,50 Z" fill="#14532d"/>
     <path d="M100,58 C120,58 136,88 132,124 C128,155 102,158 88,144 C74,130 70,108 78,88 C84,70 92,58 100,58 Z" fill="#bef264"/>
     <circle cx="106" cy="120" r="22" fill="#78350f"/>
     <circle cx="103" cy="116" r="20" fill="#a16207"/>`
  ),

  'fresh-kiwi': svgWrapper(
    '<stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#d1fae5"/>',
    `<circle cx="100" cy="110" r="48" fill="#713f12"/>
     <circle cx="100" cy="110" r="42" fill="#65a30d"/>
     <circle cx="100" cy="110" r="16" fill="#fef08a"/>
     <circle cx="100" cy="98" r="2" fill="#1c1917"/>
     <circle cx="112" cy="104" r="2" fill="#1c1917"/>
     <circle cx="112" cy="118" r="2" fill="#1c1917"/>
     <circle cx="100" cy="124" r="2" fill="#1c1917"/>
     <circle cx="88" cy="118" r="2" fill="#1c1917"/>
     <circle cx="88" cy="104" r="2" fill="#1c1917"/>`
  ),

  'fresh-berries': svgWrapper(
    '<stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/>',
    `<circle cx="85" cy="120" r="28" fill="#1e3a8a"/>
     <circle cx="120" cy="124" r="26" fill="#1e40af"/>
     <circle cx="102" cy="92" r="24" fill="#2563eb"/>
     <!-- Highlights -->
     <circle cx="78" cy="112" r="6" fill="#93c5fd" opacity="0.6"/>
     <circle cx="114" cy="116" r="6" fill="#93c5fd" opacity="0.6"/>
     <circle cx="96" cy="84" r="5" fill="#bfdbfe" opacity="0.7"/>`
  ),

  'farm-tomatoes': svgWrapper(
    '<stop offset="0%" stop-color="#fee2e2"/><stop offset="100%" stop-color="#fecaca"/>',
    `<circle cx="90" cy="115" r="44" fill="#dc2626"/>
     <circle cx="116" cy="115" r="42" fill="#b91c1c"/>
     <ellipse cx="80" cy="96" rx="10" ry="22" fill="#f87171" opacity="0.6" transform="rotate(-25 80 96)"/>
     <!-- Calyx -->
     <path d="M102,70 L96,54 L104,62 L112,54 L108,70 Z" fill="#16a34a"/>
     <path d="M92,72 L76,64 L88,68 Z" fill="#22c55e"/>
     <path d="M116,72 L132,64 L120,68 Z" fill="#22c55e"/>`
  ),

  'gold-potatoes': svgWrapper(
    '<stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>',
    `<ellipse cx="98" cy="115" rx="54" ry="40" fill="#ca8a04"/>
     <ellipse cx="98" cy="115" rx="50" ry="36" fill="#d97706"/>
     <ellipse cx="78" cy="100" rx="14" ry="8" fill="#fde68a" opacity="0.4"/>
     <circle cx="70" cy="120" r="3" fill="#854d0e"/>
     <circle cx="110" cy="105" r="3" fill="#854d0e"/>
     <circle cx="130" cy="122" r="3" fill="#854d0e"/>
     <circle cx="94" cy="132" r="3" fill="#854d0e"/>`
  ),

  'pink-onions': svgWrapper(
    '<stop offset="0%" stop-color="#fdf2f8"/><stop offset="100%" stop-color="#fce7f3"/>',
    `<ellipse cx="100" cy="120" rx="46" ry="42" fill="#9d174d"/>
     <path d="M100,78 C100,60 102,48 104,44 L96,44 C98,48 100,60 100,78 Z" fill="#831843"/>
     <!-- Stripes -->
     <path d="M75,95 C75,120 85,150 95,158" stroke="#be185d" stroke-width="3" fill="none" opacity="0.6"/>
     <path d="M125,95 C125,120 115,150 105,158" stroke="#be185d" stroke-width="3" fill="none" opacity="0.6"/>
     <path d="M100,80 L100,162" stroke="#be185d" stroke-width="3" fill="none" opacity="0.6"/>
     <!-- Root -->
     <path d="M96,162 L94,170 M100,162 L100,172 M104,162 L106,170" stroke="#78350f" stroke-width="2"/>`
  ),

  'fresh-cauliflower': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<g fill="#15803d">
      <ellipse cx="65" cy="125" rx="18" ry="36" transform="rotate(-30 65 125)"/>
      <ellipse cx="135" cy="125" rx="18" ry="36" transform="rotate(30 135 125)"/>
      <ellipse cx="100" cy="148" rx="36" ry="16"/>
     </g>
     <g fill="#f8fafc">
      <circle cx="82" cy="98" r="22"/>
      <circle cx="118" cy="98" r="22"/>
      <circle cx="100" cy="80" r="24"/>
      <circle cx="100" cy="106" r="24"/>
      <circle cx="75" cy="120" r="16"/>
      <circle cx="125" cy="120" r="16"/>
     </g>`
  ),

  'green-cabbage': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#bbf7d0"/>',
    `<circle cx="100" cy="112" r="48" fill="#15803d"/>
     <path d="M60,112 C60,82 100,75 125,95 C140,110 135,140 100,155 C70,145 60,130 60,112 Z" fill="#16a34a"/>
     <path d="M75,100 C85,85 115,85 125,100 C115,120 85,120 75,100 Z" fill="#22c55e"/>
     <!-- Veins -->
     <path d="M100,85 L100,135 M90,105 L110,105 M85,120 L115,120" stroke="#86efac" stroke-width="2.5" stroke-linecap="round"/>`
  ),

  'fresh-broccoli': svgWrapper(
    '<stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#d1fae5"/>',
    `<path d="M92,120 L88,162 L112,162 L108,120 Z" fill="#86efac"/>
     <g fill="#15803d">
      <circle cx="75" cy="95" r="24"/>
      <circle cx="125" cy="95" r="24"/>
      <circle cx="100" cy="74" r="26"/>
      <circle cx="100" cy="102" r="26"/>
      <circle cx="68" cy="115" r="16"/>
      <circle cx="132" cy="115" r="16"/>
     </g>`
  ),

  'baby-carrots': svgWrapper(
    '<stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>',
    `<path d="M100,48 C100,32 108,22 115,18 M100,48 C94,32 88,24 82,20 M100,48 L100,22" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M84,65 C84,55 116,55 116,65 L106,165 C104,172 96,172 94,165 Z" fill="#f97316"/>
     <path d="M88,85 L108,85 M86,110 L112,110 M90,135 L106,135" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>`
  ),

  'fresh-spinach': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<path d="M100,165 C70,140 55,100 70,65 C85,35 115,35 130,65 C145,100 130,140 100,165 Z" fill="#15803d"/>
     <path d="M100,60 L100,168" stroke="#86efac" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M100,90 L78,75 M100,115 L75,105 M100,135 L80,128" stroke="#86efac" stroke-width="2" stroke-linecap="round"/>
     <path d="M100,90 L122,75 M100,115 L125,105 M100,135 L120,128" stroke="#86efac" stroke-width="2" stroke-linecap="round"/>`
  ),

  'bell-peppers': svgWrapper(
    '<stop offset="0%" stop-color="#fef2f2"/><stop offset="100%" stop-color="#fee2e2"/>',
    `<g fill="#dc2626">
      <ellipse cx="80" cy="115" rx="22" ry="42"/>
      <ellipse cx="120" cy="115" rx="22" ry="42"/>
      <ellipse cx="100" cy="118" rx="24" ry="44"/>
     </g>
     <path d="M100,74 C100,56 106,46 112,42" stroke="#15803d" stroke-width="5" stroke-linecap="round" fill="none"/>
     <ellipse cx="82" cy="100" rx="6" ry="18" fill="#f87171" opacity="0.6" transform="rotate(-15 82 100)"/>`
  ),

  'sweet-corn': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fef9c3"/>',
    `<ellipse cx="100" cy="112" rx="26" ry="52" fill="#eab308"/>
     <!-- Kernels grid -->
     <g fill="#ca8a04">
      <circle cx="92" cy="85" r="3"/><circle cx="100" cy="85" r="3"/><circle cx="108" cy="85" r="3"/>
      <circle cx="90" cy="100" r="3"/><circle cx="100" cy="100" r="3"/><circle cx="110" cy="100" r="3"/>
      <circle cx="90" cy="115" r="3"/><circle cx="100" cy="115" r="3"/><circle cx="110" cy="115" r="3"/>
      <circle cx="92" cy="130" r="3"/><circle cx="100" cy="130" r="3"/><circle cx="108" cy="130" r="3"/>
     </g>
     <!-- Husk -->
     <path d="M80,145 C65,120 70,80 72,70 C75,95 82,145 100,165 Z" fill="#65a30d"/>
     <path d="M120,145 C135,120 130,80 128,70 C125,95 118,145 100,165 Z" fill="#4d7c0f"/>`
  ),

  'green-beans': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<path d="M60,60 C80,85 100,135 95,160" stroke="#15803d" stroke-width="12" stroke-linecap="round" fill="none"/>
     <path d="M80,50 C100,80 120,130 115,160" stroke="#16a34a" stroke-width="12" stroke-linecap="round" fill="none"/>
     <path d="M100,55 C120,85 135,130 130,155" stroke="#22c55e" stroke-width="10" stroke-linecap="round" fill="none"/>`
  ),

  'green-peas': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#bbf7d0"/>',
    `<path d="M45,75 C70,120 130,145 160,115 C130,145 70,130 45,75 Z" fill="#15803d"/>
     <circle cx="75" cy="110" r="12" fill="#22c55e"/>
     <circle cx="100" cy="116" r="12" fill="#4ade80"/>
     <circle cx="125" cy="114" r="12" fill="#22c55e"/>
     <circle cx="146" cy="108" r="9" fill="#16a34a"/>`
  ),

  'fresh-bhindi': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<path d="M85,55 L115,55 L104,168 C102,172 98,172 96,168 Z" fill="#15803d"/>
     <rect x="88" y="44" width="24" height="12" rx="4" fill="#14532d"/>
     <!-- Ridges -->
     <line x1="94" y1="56" x2="98" y2="165" stroke="#4ade80" stroke-width="2"/>
     <line x1="106" y1="56" x2="102" y2="165" stroke="#4ade80" stroke-width="2"/>`
  ),

  'bottle-gourd': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#bbf7d0"/>',
    `<ellipse cx="100" cy="80" rx="18" ry="24" fill="#65a30d"/>
     <ellipse cx="100" cy="130" rx="34" ry="40" fill="#84cc16"/>
     <path d="M100,56 L100,44" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>`
  ),

  'ginger-garlic': svgWrapper(
    '<stop offset="0%" stop-color="#fafaf9"/><stop offset="100%" stop-color="#f5f5f4"/>',
    `<!-- Ginger root -->
     <path d="M60,110 C50,90 70,80 80,95 C90,85 105,95 100,115 C115,120 110,140 90,145 C75,150 65,130 60,110 Z" fill="#d97706"/>
     <!-- Garlic bulb -->
     <g fill="#ffffff">
      <ellipse cx="130" cy="125" rx="14" ry="24" transform="rotate(-15 130 125)"/>
      <ellipse cx="150" cy="125" rx="14" ry="24" transform="rotate(15 150 125)"/>
      <ellipse cx="140" cy="122" rx="16" ry="26"/>
     </g>
     <path d="M140,96 L140,84" stroke="#a8a29e" stroke-width="3"/>`
  ),

  'milk-toned': svgWrapper(
    '<stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/>',
    `<rect x="68" y="70" width="64" height="96" rx="8" fill="#ffffff"/>
     <polygon points="68,70 100,48 132,70" fill="#3b82f6"/>
     <rect x="90" y="38" width="20" height="12" rx="2" fill="#1d4ed8"/>
     <!-- Blue stripe and label -->
     <rect x="68" y="95" width="64" height="28" fill="#2563eb"/>
     <text x="100" y="114" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">MILK</text>
     <text x="100" y="142" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle" font-family="sans-serif">1 LITER</text>`
  ),

  'milk-full-cream': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fef08a"/>',
    `<rect x="68" y="70" width="64" height="96" rx="8" fill="#ffffff"/>
     <polygon points="68,70 100,48 132,70" fill="#eab308"/>
     <rect x="90" y="38" width="20" height="12" rx="2" fill="#ca8a04"/>
     <!-- Gold stripe and label -->
     <rect x="68" y="95" width="64" height="28" fill="#ca8a04"/>
     <text x="100" y="114" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">GOLD MILK</text>
     <text x="100" y="142" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle" font-family="sans-serif">FULL CREAM</text>`
  ),

  'malai-paneer': svgWrapper(
    '<stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#f1f5f9"/>',
    `<rect x="55" y="75" width="90" height="75" rx="8" fill="#ffffff"/>
     <rect x="58" y="78" width="84" height="69" rx="6" fill="#f8fafc"/>
     <!-- Grid lines for cubes -->
     <line x1="85" y1="78" x2="85" y2="147" stroke="#e2e8f0" stroke-width="2"/>
     <line x1="115" y1="78" x2="115" y2="147" stroke="#e2e8f0" stroke-width="2"/>
     <line x1="58" y1="101" x2="142" y2="101" stroke="#e2e8f0" stroke-width="2"/>
     <line x1="58" y1="124" x2="142" y2="124" stroke="#e2e8f0" stroke-width="2"/>
     <text x="100" y="165" font-size="10" font-weight="bold" fill="#0f766e" text-anchor="middle" font-family="sans-serif">FRESH PANEER</text>`
  ),

  'probiotic-dahi': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdfa"/><stop offset="100%" stop-color="#ccfbf1"/>',
    `<ellipse cx="100" cy="75" rx="42" ry="12" fill="#0d9488"/>
     <path d="M58,75 L68,145 C70,155 130,155 132,145 L142,75 Z" fill="#ffffff"/>
     <rect x="64" y="98" width="72" height="26" fill="#0f766e"/>
     <text x="100" y="115" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">DAHI / CURD</text>`
  ),

  'table-butter': svgWrapper(
    '<stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#fde047"/>',
    `<polygon points="50,110 80,75 155,75 125,110" fill="#fef08a"/>
     <polygon points="125,110 155,75 155,115 125,150" fill="#eab308"/>
     <polygon points="50,110 125,110 125,150 50,150" fill="#facc15"/>
     <text x="88" y="134" font-size="12" font-weight="900" fill="#713f12" text-anchor="middle" font-family="sans-serif">BUTTER</text>`
  ),

  'cheddar-cheese': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<polygon points="50,135 150,75 150,115 50,155" fill="#f59e0b"/>
     <polygon points="50,135 150,75 120,60 40,115" fill="#fbbf24"/>
     <polygon points="40,115 120,60 120,95 40,140" fill="#fde68a"/>
     <circle cx="75" cy="132" r="5" fill="#d97706"/>
     <circle cx="110" cy="100" r="6" fill="#d97706"/>
     <circle cx="135" cy="90" r="4" fill="#d97706"/>`
  ),

  'desi-ghee': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fde047"/>',
    `<rect x="65" y="75" width="70" height="85" rx="10" fill="#fef08a"/>
     <rect x="75" y="58" width="50" height="18" rx="4" fill="#b45309"/>
     <!-- Golden label -->
     <rect x="65" y="98" width="70" height="30" fill="#d97706"/>
     <text x="100" y="117" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">DESI GHEE</text>`
  ),

  'farm-eggs': svgWrapper(
    '<stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#fed7aa"/>',
    `<g fill="#ffedd5">
      <ellipse cx="80" cy="115" rx="20" ry="28" transform="rotate(-15 80 115)"/>
      <ellipse cx="120" cy="115" rx="20" ry="28" transform="rotate(15 120 115)"/>
      <ellipse cx="100" cy="105" rx="20" ry="30"/>
     </g>
     <path d="M50,135 L150,135 L140,165 L60,165 Z" fill="#b45309"/>
     <text x="100" y="154" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">FARM EGGS</text>`
  ),

  'sourdough-bread': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<ellipse cx="100" cy="115" rx="60" ry="38" fill="#b45309"/>
     <ellipse cx="100" cy="112" rx="56" ry="34" fill="#d97706"/>
     <!-- Sourdough score cuts -->
     <path d="M70,105 Q100,92 130,105" stroke="#78350f" stroke-width="3.5" fill="none"/>
     <path d="M60,118 Q100,105 140,118" stroke="#78350f" stroke-width="3" fill="none"/>`
  ),

  'butter-croissant': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<path d="M45,135 C55,90 145,90 155,135 C135,115 65,115 45,135 Z" fill="#d97706"/>
     <ellipse cx="100" cy="115" rx="36" ry="26" fill="#f59e0b"/>
     <ellipse cx="100" cy="112" rx="26" ry="22" fill="#fbbf24"/>
     <ellipse cx="100" cy="110" rx="14" ry="18" fill="#fde68a"/>`
  ),

  'plain-bagel': svgWrapper(
    '<stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>',
    `<ellipse cx="100" cy="115" rx="55" ry="42" fill="#d97706"/>
     <ellipse cx="100" cy="112" rx="50" ry="38" fill="#f59e0b"/>
     <ellipse cx="100" cy="112" rx="18" ry="14" fill="#fef3c7"/>
     <!-- Sesame seeds -->
     <circle cx="80" cy="95" r="1.5" fill="#78350f"/>
     <circle cx="120" cy="98" r="1.5" fill="#78350f"/>
     <circle cx="70" cy="115" r="1.5" fill="#78350f"/>
     <circle cx="130" cy="118" r="1.5" fill="#78350f"/>`
  ),

  'chocolate-cake': svgWrapper(
    '<stop offset="0%" stop-color="#fdf2f8"/><stop offset="100%" stop-color="#fce7f3"/>',
    `<polygon points="45,145 155,145 140,85 60,85" fill="#451a03"/>
     <polygon points="45,120 155,120 150,112 50,112" fill="#e11d48"/>
     <polygon points="60,85 140,85 130,70 70,70" fill="#78350f"/>
     <circle cx="100" cy="62" r="8" fill="#dc2626"/>`
  ),

  'blueberry-muffin': svgWrapper(
    '<stop offset="0%" stop-color="#f5f3ff"/><stop offset="100%" stop-color="#ede9fe"/>',
    `<polygon points="68,120 132,120 124,165 76,165" fill="#d97706"/>
     <path d="M55,120 C50,85 150,85 145,120 Z" fill="#f59e0b"/>
     <circle cx="85" cy="100" r="5" fill="#1e3a8a"/>
     <circle cx="115" cy="104" r="5" fill="#1e3a8a"/>
     <circle cx="100" cy="92" r="5" fill="#1e3a8a"/>`
  ),

  'biscuit-cookies': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<circle cx="90" cy="115" r="42" fill="#d97706"/>
     <circle cx="115" cy="115" r="38" fill="#f59e0b"/>
     <g fill="#78350f">
      <circle cx="105" cy="98" r="4"/><circle cx="125" cy="105" r="4"/>
      <circle cx="110" cy="120" r="4"/><circle cx="130" cy="125" r="4"/>
      <circle cx="118" cy="138" r="4"/>
     </g>`
  ),

  'basmati-rice': svgWrapper(
    '<stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#f1f5f9"/>',
    `<path d="M60,65 L140,65 L145,160 L55,160 Z" fill="#f8fafc"/>
     <rect x="65" y="85" width="70" height="42" fill="#15803d"/>
     <text x="100" y="104" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">BASMATI</text>
     <text x="100" y="118" font-size="9" font-weight="bold" fill="#86efac" text-anchor="middle" font-family="sans-serif">ROYAL RICE</text>
     <path d="M60,65 Q100,55 140,65" stroke="#15803d" stroke-width="4" fill="none"/>`
  ),

  'wheat-atta': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<path d="M58,60 L142,60 L148,162 L52,162 Z" fill="#fef3c7"/>
     <rect x="62" y="85" width="76" height="45" fill="#ea580c"/>
     <text x="100" y="104" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">CHAKKI</text>
     <text x="100" y="118" font-size="10" font-weight="bold" fill="#fed7aa" text-anchor="middle" font-family="sans-serif">WHEAT ATTA</text>`
  ),

  'toor-dal': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<ellipse cx="100" cy="140" rx="55" ry="25" fill="#b45309"/>
     <ellipse cx="100" cy="135" rx="50" ry="22" fill="#facc15"/>
     <!-- Grains -->
     <circle cx="85" cy="130" r="3" fill="#ca8a04"/>
     <circle cx="100" cy="135" r="3" fill="#ca8a04"/>
     <circle cx="115" cy="130" r="3" fill="#ca8a04"/>
     <text x="100" y="95" font-size="12" font-weight="900" fill="#b45309" text-anchor="middle" font-family="sans-serif">TOOR DAL</text>`
  ),

  'chickpeas-chana': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<ellipse cx="100" cy="140" rx="55" ry="25" fill="#78350f"/>
     <g fill="#fef08a">
      <circle cx="80" cy="130" r="7"/>
      <circle cx="100" cy="132" r="7"/>
      <circle cx="120" cy="128" r="7"/>
      <circle cx="90" cy="140" r="7"/>
      <circle cx="110" cy="142" r="7"/>
     </g>
     <text x="100" y="95" font-size="12" font-weight="900" fill="#78350f" text-anchor="middle" font-family="sans-serif">KABULI CHANA</text>`
  ),

  'sunflower-oil': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fef9c3"/>',
    `<rect x="75" y="70" width="50" height="96" rx="8" fill="#fef08a"/>
     <rect x="86" y="44" width="28" height="26" rx="4" fill="#eab308"/>
     <rect x="75" y="95" width="50" height="36" fill="#ca8a04"/>
     <text x="100" y="112" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">COOKING</text>
     <text x="100" y="124" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle" font-family="sans-serif">OIL (1L)</text>`
  ),

  'table-salt': svgWrapper(
    '<stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#f1f5f9"/>',
    `<rect x="70" y="65" width="60" height="100" rx="10" fill="#3b82f6"/>
     <rect x="70" y="95" width="60" height="40" fill="#ffffff"/>
     <text x="100" y="115" font-size="12" font-weight="900" fill="#1d4ed8" text-anchor="middle" font-family="sans-serif">SALT</text>
     <text x="100" y="127" font-size="8" font-weight="bold" fill="#64748b" text-anchor="middle" font-family="sans-serif">IODIZED</text>`
  ),

  'sugar-jaggery': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<rect x="65" y="68" width="70" height="96" rx="10" fill="#d97706"/>
     <rect x="65" y="95" width="70" height="38" fill="#ffffff"/>
     <text x="100" y="114" font-size="11" font-weight="900" fill="#92400e" text-anchor="middle" font-family="sans-serif">SUGAR</text>
     <text x="100" y="126" font-size="8" font-weight="bold" fill="#b45309" text-anchor="middle" font-family="sans-serif">PURE SULPHUR-FREE</text>`
  ),

  'potato-chips': svgWrapper(
    '<stop offset="0%" stop-color="#fef2f2"/><stop offset="100%" stop-color="#fee2e2"/>',
    `<rect x="62" y="55" width="76" height="110" rx="10" fill="#3b82f6"/>
     <polygon points="62,55 100,72 138,55" fill="#1d4ed8"/>
     <circle cx="100" cy="110" r="22" fill="#fbbf24"/>
     <text x="100" y="114" font-size="10" font-weight="900" fill="#78350f" text-anchor="middle" font-family="sans-serif">CHIPS</text>`
  ),

  'namkeen-bhujia': svgWrapper(
    '<stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>',
    `<rect x="60" y="55" width="80" height="110" rx="10" fill="#f97316"/>
     <rect x="60" y="85" width="80" height="42" fill="#ffffff"/>
     <text x="100" y="105" font-size="11" font-weight="900" fill="#c2410c" text-anchor="middle" font-family="sans-serif">BHUJIA</text>
     <text x="100" y="118" font-size="9" font-weight="bold" fill="#ea580c" text-anchor="middle" font-family="sans-serif">ALOO SEV</text>`
  ),

  'roasted-makhana': svgWrapper(
    '<stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#f1f5f9"/>',
    `<g fill="#f8fafc">
      <circle cx="80" cy="100" r="16"/>
      <circle cx="120" cy="100" r="16"/>
      <circle cx="100" cy="120" r="18"/>
      <circle cx="75" cy="130" r="14"/>
      <circle cx="125" cy="130" r="14"/>
     </g>
     <circle cx="82" cy="102" r="3" fill="#a8a29e"/>
     <circle cx="102" cy="122" r="3" fill="#a8a29e"/>
     <text x="100" y="70" font-size="11" font-weight="900" fill="#0f766e" text-anchor="middle" font-family="sans-serif">MAKHANA</text>`
  ),

  'mixed-nuts': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<ellipse cx="80" cy="110" rx="16" ry="24" transform="rotate(-20 80 110)" fill="#78350f"/>
     <path d="M110,95 C125,95 135,110 125,130 C115,130 110,115 110,95 Z" fill="#fef08a"/>
     <circle cx="100" cy="135" r="12" fill="#15803d"/>
     <text x="100" y="70" font-size="11" font-weight="900" fill="#78350f" text-anchor="middle" font-family="sans-serif">DRY FRUITS</text>`
  ),

  'dark-chocolate': svgWrapper(
    '<stop offset="0%" stop-color="#fdf2f8"/><stop offset="100%" stop-color="#fce7f3"/>',
    `<rect x="65" y="60" width="70" height="105" rx="6" fill="#3b0764"/>
     <!-- Foil wrapper top -->
     <rect x="65" y="60" width="70" height="40" fill="#e2e8f0"/>
     <text x="100" y="125" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">DARK</text>
     <text x="100" y="140" font-size="9" font-weight="bold" fill="#d8b4fe" text-anchor="middle" font-family="sans-serif">CHOCOLATE</text>`
  ),

  'granola-bars': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<rect x="55" y="90" width="90" height="38" rx="6" fill="#b45309"/>
     <rect x="55" y="90" width="90" height="38" rx="6" fill="#d97706" opacity="0.6"/>
     <circle cx="70" cy="105" r="3" fill="#fef08a"/>
     <circle cx="90" cy="112" r="3" fill="#fef08a"/>
     <circle cx="110" cy="102" r="3" fill="#fef08a"/>
     <circle cx="130" cy="110" r="3" fill="#fef08a"/>
     <text x="100" y="75" font-size="10" font-weight="900" fill="#78350f" text-anchor="middle" font-family="sans-serif">GRANOLA BAR</text>`
  ),

  'instant-noodles': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fef08a"/>',
    `<rect x="60" y="65" width="80" height="96" rx="10" fill="#eab308"/>
     <circle cx="100" cy="112" r="24" fill="#dc2626"/>
     <text x="100" y="117" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">NOODLES</text>`
  ),

  'sauces-spreads': svgWrapper(
    '<stop offset="0%" stop-color="#fef2f2"/><stop offset="100%" stop-color="#fee2e2"/>',
    `<path d="M78,65 L122,65 L118,155 L82,155 Z" fill="#dc2626"/>
     <rect x="88" y="44" width="24" height="22" rx="3" fill="#15803d"/>
     <rect x="80" y="90" width="40" height="36" fill="#ffffff"/>
     <text x="100" y="112" font-size="8" font-weight="900" fill="#dc2626" text-anchor="middle" font-family="sans-serif">SAUCE</text>`
  ),

  'fruit-juice': svgWrapper(
    '<stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>',
    `<rect x="70" y="65" width="60" height="100" rx="10" fill="#ea580c"/>
     <polygon points="70,65 100,48 130,65" fill="#f97316"/>
     <circle cx="100" cy="110" r="18" fill="#ffffff"/>
     <text x="100" y="114" font-size="9" font-weight="900" fill="#ea580c" text-anchor="middle" font-family="sans-serif">JUICE</text>`
  ),

  'green-tea': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<rect x="65" y="70" width="70" height="90" rx="8" fill="#15803d"/>
     <path d="M100,50 L100,70" stroke="#86efac" stroke-width="2"/>
     <rect x="94" y="42" width="12" height="8" rx="2" fill="#e2e8f0"/>
     <text x="100" y="115" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">TEA</text>
     <text x="100" y="128" font-size="8" font-weight="bold" fill="#86efac" text-anchor="middle" font-family="sans-serif">HERBAL GREEN</text>`
  ),

  'cold-brew': svgWrapper(
    '<stop offset="0%" stop-color="#fafaf9"/><stop offset="100%" stop-color="#f5f5f4"/>',
    `<rect x="74" y="65" width="52" height="100" rx="10" fill="#1c1917"/>
     <rect x="85" y="45" width="30" height="20" rx="4" fill="#d97706"/>
     <rect x="78" y="95" width="44" height="38" fill="#d97706"/>
     <text x="100" y="112" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">COLD</text>
     <text x="100" y="124" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle" font-family="sans-serif">BREW</text>`
  ),

  'sparkling-water': svgWrapper(
    '<stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/>',
    `<rect x="75" y="65" width="50" height="100" rx="10" fill="#0284c7"/>
     <rect x="85" y="46" width="30" height="20" rx="3" fill="#bae6fd"/>
     <rect x="75" y="95" width="50" height="32" fill="#ffffff"/>
     <text x="100" y="115" font-size="9" font-weight="900" fill="#0284c7" text-anchor="middle" font-family="sans-serif">WATER</text>`
  ),

  'bath-soap': svgWrapper(
    '<stop offset="0%" stop-color="#ecfeff"/><stop offset="100%" stop-color="#cffafe"/>',
    `<rect x="55" y="78" width="90" height="60" rx="16" fill="#06b6d4"/>
     <ellipse cx="100" cy="108" rx="36" ry="18" fill="#22d3ee"/>
     <text x="100" y="114" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">SOAP</text>`
  ),

  'shampoo-bottle': svgWrapper(
    '<stop offset="0%" stop-color="#fdf4ff"/><stop offset="100%" stop-color="#fae8ff"/>',
    `<path d="M75,70 C75,55 125,55 125,70 L120,165 L80,165 Z" fill="#9333ea"/>
     <rect x="88" y="38" width="24" height="18" rx="4" fill="#d8b4fe"/>
     <rect x="80" y="95" width="40" height="40" fill="#ffffff"/>
     <text x="100" y="118" font-size="8" font-weight="900" fill="#9333ea" text-anchor="middle" font-family="sans-serif">SHAMPOO</text>`
  ),

  'oral-care': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<polygon points="60,75 140,75 130,160 70,160" fill="#16a34a"/>
     <rect x="88" y="48" width="24" height="28" rx="4" fill="#ffffff"/>
     <rect x="68" y="95" width="64" height="32" fill="#ffffff"/>
     <text x="100" y="115" font-size="9" font-weight="900" fill="#16a34a" text-anchor="middle" font-family="sans-serif">TOOTHPASTE</text>`
  ),

  'skin-care': svgWrapper(
    '<stop offset="0%" stop-color="#fff1f2"/><stop offset="100%" stop-color="#ffe4e6"/>',
    `<ellipse cx="100" cy="80" rx="42" ry="14" fill="#f43f5e"/>
     <rect x="58" y="80" width="84" height="70" rx="8" fill="#ffffff"/>
     <text x="100" y="122" font-size="10" font-weight="900" fill="#e11d48" text-anchor="middle" font-family="sans-serif">SKIN CARE</text>`
  ),

  'detergent-powder': svgWrapper(
    '<stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/>',
    `<rect x="60" y="55" width="80" height="110" rx="10" fill="#2563eb"/>
     <!-- Sparkle circle -->
     <circle cx="100" cy="110" r="26" fill="#facc15"/>
     <text x="100" y="115" font-size="10" font-weight="900" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">DETERGENT</text>`
  ),

  'dishwash-cleaner': svgWrapper(
    '<stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#d1fae5"/>',
    `<path d="M78,65 L122,65 L118,160 L82,160 Z" fill="#16a34a"/>
     <rect x="90" y="42" width="20" height="24" rx="4" fill="#fbbf24"/>
     <rect x="80" y="95" width="40" height="35" fill="#ffffff"/>
     <text x="100" y="116" font-size="8" font-weight="900" fill="#15803d" text-anchor="middle" font-family="sans-serif">DISHWASH</text>`
  ),

  'home-care': svgWrapper(
    '<stop offset="0%" stop-color="#f5f3ff"/><stop offset="100%" stop-color="#ede9fe"/>',
    `<rect x="75" y="65" width="50" height="100" rx="10" fill="#7c3aed"/>
     <rect x="88" y="44" width="24" height="22" rx="4" fill="#a78bfa"/>
     <circle cx="100" cy="115" r="16" fill="#ffffff"/>
     <text x="100" y="118" font-size="8" font-weight="900" fill="#7c3aed" text-anchor="middle" font-family="sans-serif">FRESH</text>`
  ),

  'baby-care': svgWrapper(
    '<stop offset="0%" stop-color="#fdf4ff"/><stop offset="100%" stop-color="#fae8ff"/>',
    `<path d="M60,85 C60,65 140,65 140,85 L130,150 C100,165 100,165 70,150 Z" fill="#ffffff"/>
     <circle cx="100" cy="105" r="14" fill="#f472b6"/>
     <text x="100" y="142" font-size="9" font-weight="900" fill="#a21caf" text-anchor="middle" font-family="sans-serif">BABY CARE</text>`
  ),

  'pet-food': svgWrapper(
    '<stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>',
    `<rect x="62" y="60" width="76" height="105" rx="10" fill="#ea580c"/>
     <!-- Bone shape -->
     <circle cx="90" cy="105" r="6" fill="#ffffff"/>
     <circle cx="90" cy="117" r="6" fill="#ffffff"/>
     <rect x="90" y="108" width="20" height="6" fill="#ffffff"/>
     <circle cx="110" cy="105" r="6" fill="#ffffff"/>
     <circle cx="110" cy="117" r="6" fill="#ffffff"/>
     <text x="100" y="145" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">PET FOOD</text>`
  ),

  'pooja-essentials': svgWrapper(
    '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/>',
    `<rect x="60" y="70" width="80" height="90" rx="8" fill="#b45309"/>
     <!-- Diya flame -->
     <path d="M100,42 C92,54 92,62 100,68 C108,62 108,54 100,42 Z" fill="#f59e0b"/>
     <circle cx="100" cy="58" r="4" fill="#ef4444"/>
     <text x="100" y="118" font-size="10" font-weight="900" fill="#fef08a" text-anchor="middle" font-family="sans-serif">AGARBATTI</text>`
  ),

  'indian-sweets': svgWrapper(
    '<stop offset="0%" stop-color="#fefce8"/><stop offset="100%" stop-color="#fef08a"/>',
    `<g fill="#f59e0b">
      <circle cx="80" cy="115" r="16"/>
      <circle cx="120" cy="115" r="16"/>
      <circle cx="100" cy="130" r="16"/>
      <circle cx="100" cy="98" r="16"/>
     </g>
     <g fill="#15803d">
      <circle cx="80" cy="112" r="2"/>
      <circle cx="120" cy="112" r="2"/>
      <circle cx="100" cy="95" r="2"/>
     </g>
     <text x="100" y="165" font-size="10" font-weight="900" fill="#92400e" text-anchor="middle" font-family="sans-serif">MITHAI</text>`
  ),

  'fresh-chicken': svgWrapper(
    '<stop offset="0%" stop-color="#fff1f2"/><stop offset="100%" stop-color="#ffe4e6"/>',
    `<ellipse cx="100" cy="120" rx="46" ry="32" fill="#fda4af"/>
     <path d="M60,118 L40,110 C36,108 36,102 40,100 L62,108 Z" fill="#f8fafc"/>
     <ellipse cx="100" cy="116" rx="38" ry="24" fill="#fb7185"/>
     <text x="100" y="165" font-size="10" font-weight="900" fill="#be123c" text-anchor="middle" font-family="sans-serif">FRESH MEAT</text>`
  ),

  'grocery-default': svgWrapper(
    '<stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/>',
    `<path d="M60,85 L140,85 L132,160 L68,160 Z" fill="#15803d"/>
     <!-- Handle -->
     <path d="M82,85 C82,60 118,60 118,85" stroke="#166534" stroke-width="6" fill="none" stroke-linecap="round"/>
     <!-- Logo icon on bag -->
     <circle cx="100" cy="120" r="18" fill="#ffffff"/>
     <path d="M92,120 Q100,108 108,120 Q100,132 92,120" fill="#22c55e"/>`
  )
};

// Department defaults
const DEPARTMENT_SVGS = {
  'dept-fresh-produce': PRODUCT_SVGS['fresh-apples'],
  'dept-dairy-eggs': PRODUCT_SVGS['milk-toned'],
  'dept-bakery': PRODUCT_SVGS['sourdough-bread'],
  'dept-confectionery': PRODUCT_SVGS['dark-chocolate'],
  'dept-frozen-foods': PRODUCT_SVGS['instant-noodles'],
  'dept-staples-grains': PRODUCT_SVGS['basmati-rice'],
  'dept-dry-fruits': PRODUCT_SVGS['mixed-nuts'],
  'dept-snacks-munchies': PRODUCT_SVGS['potato-chips'],
  'dept-beverages': PRODUCT_SVGS['fruit-juice'],
  'dept-instant-foods': PRODUCT_SVGS['instant-noodles'],
  'dept-personal-care': PRODUCT_SVGS['bath-soap'],
  'dept-baby-care': PRODUCT_SVGS['baby-care'],
  'dept-household-cleaning': PRODUCT_SVGS['detergent-powder'],
  'dept-wellness': PRODUCT_SVGS['green-tea'],
  'dept-regional-foods': PRODUCT_SVGS['indian-sweets'],
  'dept-pet-supplies': PRODUCT_SVGS['pet-food'],
  'dept-pooja-essentials': PRODUCT_SVGS['pooja-essentials']
};

function buildAssets() {
  console.log('🎨 Generating High-Fidelity Quick-Commerce Vector Assets...');

  // 1. Build product family SVGs
  let pCount = 0;
  for (const [key, svgContent] of Object.entries(PRODUCT_SVGS)) {
    const filePath = path.join(PRODUCTS_DIR, `${key}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    pCount++;
  }
  console.log(`   ✅ Generated ${pCount} product family SVGs in public/images/products/`);

  // 2. Build department SVGs
  let dCount = 0;
  for (const [key, svgContent] of Object.entries(DEPARTMENT_SVGS)) {
    const filePath = path.join(CATEGORIES_DIR, `${key}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    dCount++;
  }
  console.log(`   ✅ Generated ${dCount} department SVGs in public/images/categories/`);

  // 3. Fallback SVG
  fs.writeFileSync(path.join(ROOT_IMAGES_DIR, 'fallback.svg'), PRODUCT_SVGS['grocery-default'], 'utf8');
  console.log('   ✅ Generated public/images/fallback.svg');
}

if (require.main === module) {
  buildAssets();
}

module.exports = { buildAssets, PRODUCT_SVGS, DEPARTMENT_SVGS };
