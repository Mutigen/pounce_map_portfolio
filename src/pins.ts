import config from './config';
import type { PinColor, BadgeLetter } from './types';

const { PIN_COLORS, FLASH_BORDER_COLOR } = config;

// SVG cache to avoid regenerating identical pins
const pinCache = new Map<string, string>();

/**
 * Generate SVG paddle pin.
 * Spec: 50px wide x 60px tall (40px paddle + 20px stem).
 * Badge: 16x16 circle, top-right.
 * Score: centered, 18px bold.
 */
export function createPaddlePinSvg(
  score: string,
  color: PinColor,
  badge: BadgeLetter,
): string {
  const cacheKey = `${color}-${score}-${badge}`;
  const cached = pinCache.get(cacheKey);
  if (cached) return cached;

  const fill = PIN_COLORS[color] || PIN_COLORS.blue;
  const isFlash = color === 'flash';
  const borderAttr = isFlash
    ? `stroke="${FLASH_BORDER_COLOR}" stroke-width="3"`
    : 'stroke="white" stroke-width="1.5"';

  // Animated glow rings for flash pins
  const flashRings = isFlash
    ? `<circle cx="25" cy="20" r="28" fill="none" stroke="rgba(255,107,0,0.4)" stroke-width="4">
        <animate attributeName="r" values="24;32;24" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
      </circle>`
    : '';

  // Badge circle (16x16, top-right of paddle)
  const badgeMarkup = badge
    ? `<circle cx="42" cy="8" r="8"
              fill="rgba(255,255,255,0.9)"
              stroke="${fill}" stroke-width="1"/>
      <text x="42" y="12"
            text-anchor="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="10" font-weight="700"
            fill="${fill}">${badge}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
  ${flashRings}
  <defs>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  <g filter="url(#ds)">
    <rect x="1" y="1" width="48" height="38" rx="8"
          fill="${fill}" ${borderAttr}/>
    <polygon points="19,39 25,55 31,39" fill="${fill}"/>
    <text x="25" y="26"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, sans-serif"
          font-size="18" font-weight="700"
          fill="white">${score}</text>
    ${badgeMarkup}
  </g>
</svg>`;

  pinCache.set(cacheKey, svg);
  return svg;
}

/** Convert SVG string to data URL for google.maps.Marker icon */
export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

/** Create a google.maps.Icon for a lead pin */
export function createPinIcon(
  score: string,
  color: PinColor,
  badge: BadgeLetter,
): google.maps.Icon {
  const svg = createPaddlePinSvg(score, color, badge);
  return {
    url: svgToDataUrl(svg),
    scaledSize: new google.maps.Size(50, 60),
    anchor: new google.maps.Point(25, 55),
    labelOrigin: new google.maps.Point(25, 20),
  };
}

/** Create a cluster icon with dominant color */
export function createClusterSvg(count: number, color: PinColor): string {
  const fill = PIN_COLORS[color] || PIN_COLORS.blue;
  const size = Math.min(50 + Math.floor(count / 100) * 5, 80);
  const half = size / 2;
  const fontSize = count < 100 ? 14 : 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <circle cx="${half}" cy="${half}" r="${half - 2}"
          fill="${fill}" fill-opacity="0.85"
          stroke="white" stroke-width="3"/>
  <text x="${half}" y="${half + 5}"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="${fontSize}" font-weight="700"
        fill="white">${count}</text>
</svg>`;
}
