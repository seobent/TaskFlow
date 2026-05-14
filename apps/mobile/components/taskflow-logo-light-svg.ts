export const TASKFLOW_LIGHT_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360" role="img" aria-labelledby="title desc">
  <title id="title">TaskFlow logo</title>
  <desc id="desc">A stacked task board mark with an upward arrow and the TaskFlow wordmark.</desc>
  <defs>
    <linearGradient id="mintBar" x1="44" x2="300" y1="70" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#19aaa1" />
      <stop offset="1" stop-color="#159284" />
    </linearGradient>
    <linearGradient id="mintFill" x1="70" x2="282" y1="94" y2="94" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9de5df" />
      <stop offset="1" stop-color="#60cec3" />
    </linearGradient>
    <linearGradient id="pinkBar" x1="44" x2="300" y1="250" y2="250" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#d92d86" />
      <stop offset="1" stop-color="#c01e78" />
    </linearGradient>
    <linearGradient id="pinkFill" x1="70" x2="282" y1="274" y2="274" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f5a9d2" />
      <stop offset="1" stop-color="#e56ab1" />
    </linearGradient>
    <linearGradient id="arrowFill" x1="84" x2="323" y1="302" y2="62" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f8ad20" />
      <stop offset="1" stop-color="#ff9219" />
    </linearGradient>
    <filter id="softShadow" color-interpolation-filters="sRGB" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#172033" flood-opacity="0.14" />
    </filter>
  </defs>

  <g filter="url(#softShadow)">
    <rect x="44" y="38" width="256" height="88" rx="28" fill="url(#mintBar)" />
    <rect x="68" y="58" width="208" height="48" rx="18" fill="url(#mintFill)" opacity="0.88" />

    <rect x="44" y="136" width="256" height="88" rx="28" fill="url(#mintBar)" />
    <rect x="68" y="156" width="208" height="48" rx="18" fill="url(#mintFill)" opacity="0.88" />

    <rect x="44" y="234" width="256" height="88" rx="28" fill="url(#pinkBar)" />
    <rect x="68" y="254" width="208" height="48" rx="18" fill="url(#pinkFill)" opacity="0.85" />
  </g>

  <path
    d="M18 287c66 33 133 22 184-34 28-31 42-70 65-103l-39-62 115-8-45 108-30-42c-17 23-31 48-43 75-27 60-63 100-111 120-37 15-76 13-116-7 7-13 14-28 20-47Z"
    fill="#ffffff"
    opacity="0.95"
  />
  <path
    d="M34 286c56 24 111 12 153-34 30-33 45-75 69-108l-30-47 92-7-36 86-26-36c-20 25-36 54-51 87-26 57-59 93-105 108-30 9-63 6-98-9 12-11 22-24 32-40Z"
    fill="url(#arrowFill)"
  />

  <text
    x="370"
    y="251"
    fill="#13213f"
    font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="170"
    font-weight="900"
    letter-spacing="0"
  >
    TaskFlow
  </text>
</svg>
`;
