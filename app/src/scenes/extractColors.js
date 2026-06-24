/**
 * Loads an image and samples pixels via canvas to find dominant colors.
 * Pure client-side, no network call beyond loading the image itself —
 * this is the "instant, always works" fallback layer for mood/palette.
 *
 * Returns an array of [r, g, b] arrays, most prominent first.
 */
export async function extractDominantColors(imageUrl, sampleSize = 8) {
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

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((entry) => entry.rgb);
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
