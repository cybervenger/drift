/**
 * Loads an image and samples pixels via canvas to find dominant colors.
 * Pure client-side, no network call beyond loading the image itself —
 * this is the "instant, always works" backdrop layer for mood/palette.
 *
 * Returns an array of hex color strings, most prominent first. Includes
 * basic diversity filtering so the palette isn't 4 near-identical shades
 * of the same color (which looks flat in a gradient mesh).
 */
export async function extractDominantColors(imageUrl, sampleSize = 24, paletteSize = 4) {
  if (!imageUrl) return [];

  const img = await loadImage(imageUrl);

  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Quantize to reduce near-duplicate colors into the same bucket.
    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { count: 1, rgb: [r, g, b] });
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);

  // Greedily pick colors that are reasonably distinct from ones already
  // chosen, so the palette has actual variety for a gradient mesh rather
  // than 4 shades of the same hue.
  const palette = [];
  for (const candidate of sorted) {
    if (palette.length >= paletteSize) break;
    const isDistinct = palette.every((chosen) => colorDistance(chosen.rgb, candidate.rgb) > 40);
    if (isDistinct || palette.length === 0) {
      palette.push(candidate);
    }
  }

  // Pad with the most prominent color again if we couldn't find enough
  // distinct ones (e.g. a near-monochrome album cover) — better than
  // returning fewer colors than the mesh expects.
  while (palette.length < paletteSize && sorted.length > 0) {
    palette.push(sorted[palette.length % sorted.length]);
  }

  return palette.map(({ rgb }) => rgbToHex(rgb));
}

function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
