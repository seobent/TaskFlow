export const TASKFLOW_DARK_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360">
  <defs>
    <linearGradient id="mintBarDark" x1="44" x2="300" y1="70" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#32d5c8" />
      <stop offset="1" stop-color="#21a99c" />
    </linearGradient>
    <linearGradient id="mintFillDark" x1="70" x2="282" y1="94" y2="94" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9cf1e8" />
      <stop offset="1" stop-color="#66d8cc" />
    </linearGradient>
    <linearGradient id="pinkBarDark" x1="44" x2="300" y1="250" y2="250" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ef4fa0" />
      <stop offset="1" stop-color="#d92d86" />
    </linearGradient>
    <linearGradient id="pinkFillDark" x1="70" x2="282" y1="274" y2="274" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f8b7dc" />
      <stop offset="1" stop-color="#ec7bbe" />
    </linearGradient>
    <linearGradient id="arrowFillDark" x1="84" x2="323" y1="302" y2="62" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffb228" />
      <stop offset="1" stop-color="#ff951d" />
    </linearGradient>
    <filter id="darkSoftShadow" color-interpolation-filters="sRGB" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="11" flood-color="#030712" flood-opacity="0.28" />
    </filter>
  </defs>
  <g filter="url(#darkSoftShadow)">
    <rect x="44" y="38" width="256" height="88" rx="28" fill="url(#mintBarDark)" />
    <rect x="68" y="58" width="208" height="48" rx="18" fill="url(#mintFillDark)" opacity="0.88" />
    <rect x="44" y="136" width="256" height="88" rx="28" fill="url(#mintBarDark)" />
    <rect x="68" y="156" width="208" height="48" rx="18" fill="url(#mintFillDark)" opacity="0.88" />
    <rect x="44" y="234" width="256" height="88" rx="28" fill="url(#pinkBarDark)" />
    <rect x="68" y="254" width="208" height="48" rx="18" fill="url(#pinkFillDark)" opacity="0.86" />
  </g>
  <path d="M18 287c66 33 133 22 184-34 28-31 42-70 65-103l-39-62 115-8-45 108-30-42c-17 23-31 48-43 75-27 60-63 100-111 120-37 15-76 13-116-7 7-13 14-28 20-47Z" fill="#0f172a" opacity="0.96" />
  <path d="M34 286c56 24 111 12 153-34 30-33 45-75 69-108l-30-47 92-7-36 86-26-36c-20 25-36 54-51 87-26 57-59 93-105 108-30 9-63 6-98-9 12-11 22-24 32-40Z" fill="url(#arrowFillDark)" />
  <text x="370" y="251" fill="#ffffff" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="170" font-weight="900" letter-spacing="0">TaskFlow</text>
</svg>
`;
