/**
 * Extracts dominant colors from an album art image URL.
 * Falls back to a deterministic HSL palette derived from the URL hash
 * when the canvas is tainted (Spotify CDN blocks CORS).
 *
 * Returns an array of [r, g, b] arrays, most prominent first.
 */

/* ── Deterministic fallback palette ─────────────────────────────── */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function hashPalette(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  h = Math.abs(h);
  const base = h % 360;
  return [
    hslToRgb(base,           0.70, 0.38),
    hslToRgb((base + 120) % 360, 0.60, 0.33),
    hslToRgb((base + 240) % 360, 0.65, 0.35),
    hslToRgb((base + 60)  % 360, 0.55, 0.30),
  ];
}

/* ── Canvas-based extraction (best effort) ───────────────────────── */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function extractDominantColors(imageUrl, sampleSize = 8) {
  if (!imageUrl) return hashPalette('drift-default');

  try {
    const img = await loadImage(imageUrl);

    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

    let data;
    try {
      data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    } catch {
      // Canvas tainted — Spotify CDN lacks CORS headers. Use hash fallback.
      return hashPalette(imageUrl);
    }

    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = Math.round(r / 24) + '-' + Math.round(g / 24) + '-' + Math.round(b / 24);
      const entry = buckets.get(key);
      if (entry) entry.count += 1;
      else buckets.set(key, { count: 1, rgb: [r, g, b] });
    }

    const colors = [...buckets.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((e) => e.rgb);

    return colors.length > 0 ? colors : hashPalette(imageUrl);
  } catch {
    return hashPalette(imageUrl);
  }
}
