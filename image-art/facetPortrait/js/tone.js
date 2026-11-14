// Step 2: tone. Measures how dark the photo is under each plane and
// gives the plane one of four levels:
//   0 bare paper, 1 hatch, 2 cross-hatch, 3 solid.

import { makeRng } from "./facets.js";

// Share of planes at each level, darkest first. Levels are ranked
// within the portrait, so a pale photo still gets a full range.
const SHARE_SOLID = 0.12;
const SHARE_CROSS = 0.20;
const SHARE_HATCH = 0.30;   // the rest stay bare

const SAMPLE_MAX = 400;     // the photo is shrunk to this size for measuring
const SAMPLES_PER_TRI = 80;

// Returns a function (x, y) -> brightness 0..1, in photo pixels.
export function makeSampler(img) {
  const k = Math.min(1, SAMPLE_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  return function (x, y) {
    const px = Math.max(0, Math.min(w - 1, Math.round(x * k)));
    const py = Math.max(0, Math.min(h - 1, Math.round(y * k)));
    const i = (py * w + px) * 4;
    return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  };
}

// Adds to every plane: brightness (0..1), level (0..3) and angle
// (hatch direction, radians). Feature shapes are skipped.
export function addTones(points, facets, sampler, seed) {
  const rng = makeRng(seed * 7919 + 13);
  const planes = facets.filter(f => !f.feature);

  for (const f of planes) {
    let sum = 0;
    let n = 0;
    for (const t of f.tris) {
      const a = points[t[0]], b = points[t[1]], c = points[t[2]];
      for (let i = 0; i < SAMPLES_PER_TRI; i++) {
        // An even spread of points inside the triangle.
        let u = ((i * 0.618034) % 1);
        let v = ((i * 0.754878) % 1);
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        sum += sampler(
          a.x + (b.x - a.x) * u + (c.x - a.x) * v,
          a.y + (b.y - a.y) * u + (c.y - a.y) * v
        );
        n++;
      }
    }
    f.brightness = sum / n;

    // Hatch along one of the plane's own edges, picked by the seed.
    const e = Math.floor(rng() * f.loop.length);
    const p = points[f.loop[e]];
    const q = points[f.loop[(e + 1) % f.loop.length]];
    f.angle = Math.atan2(q.y - p.y, q.x - p.x);
  }

  // Rank from darkest to lightest and hand out the levels.
  const ranked = planes.slice().sort((a, b) => a.brightness - b.brightness);
  const total = ranked.length;
  ranked.forEach((f, i) => {
    const r = (i + 0.5) / total;
    if (r < SHARE_SOLID) f.level = 3;
    else if (r < SHARE_SOLID + SHARE_CROSS) f.level = 2;
    else if (r < SHARE_SOLID + SHARE_CROSS + SHARE_HATCH) f.level = 1;
    else f.level = 0;
  });
}
