// composition.js
//
// Act one: lay down a painting with the shared brush images.
//
// Brush PNGs are white on transparent, so each pass stamps
// them into an offscreen layer and reads the alpha channel
// back as pigment density. Passes add up, so washes glaze
// over each other.
//
// All coordinates here are grid cells (GW x GH), not pixels.


const WASH_BRUSHES = [
  "Watercolor 1.png",
  "Watercolor 2.png",
  "Watercolor 3.png",
  "Watercolor 4.png",
  "Watercolor 5.png",
  "Acrylic Basic.png",
  "Creamy.png"
];

const BLOT_BRUSHES = [
  "Watercolor 6.png",
  "Guache.png",
  "Random.png",
  "Splatter.png",
  "Splatter 2.png"
];

const COMPOSITIONS = {
  horizon: composeHorizon,
  gesture: composeGesture,
  blocks: composeBlocks,
  blooms: composeBlooms
};

const COMPOSE_STRENGTH = 1.5;

let washBrushes = [];
let blotBrushes = [];

let stampLayer;


function preloadBrushes() {
  washBrushes = WASH_BRUSHES.map(name => loadImage("/common/brushes/" + name));
  blotBrushes = BLOT_BRUSHES.map(name => loadImage("/common/brushes/" + name));
}


function compose(mode) {

  if (!stampLayer) {
    stampLayer = createGraphics(GW, GH);
    stampLayer.pixelDensity(1);
  }

  COMPOSITIONS[mode]();
}


// --------------------------------------------------
// Passes and marks
// --------------------------------------------------

// Paint into a clean layer, then add its alpha to pigment k.
function brushPass(k, strength, paintFn) {

  stampLayer.clear();

  paintFn(stampLayer);

  stampLayer.loadPixels();

  const px = stampLayer.pixels;
  const d = pigments[k].density;
  const s = strength * pigments[k].strength * COMPOSE_STRENGTH;

  for (let i = 0, j = 3; i < d.length; i++, j += 4) {
    d[i] += s * px[j] / 255;
  }
}


function stamp(g, img, x, y, w, h, angle, alpha) {
  g.push();
  g.translate(x, y);
  g.rotate(angle);
  g.imageMode(CENTER);
  g.tint(255, alpha);
  g.image(img, 0, 0, w, h);
  g.pop();
}


// A wobbling run of overlapping stamps, fattest in the middle.
function washStroke(g, x1, y1, x2, y2, thick, alpha = 28, brush = null) {

  const len = dist(x1, y1, x2, y2);
  const ang = atan2(y2 - y1, x2 - x1);

  const steps = max(2, ceil(len / (thick * 0.2)));

  const img = brush || random(washBrushes);
  const wobbleSeed = random(1000);

  for (let s = 0; s <= steps; s++) {

    const t = s / steps;

    const wobble =
      (noise(wobbleSeed + t * 2.5) - 0.5) * thick * 0.9;

    const x = lerp(x1, x2, t) - sin(ang) * wobble;
    const y = lerp(y1, y2, t) + cos(ang) * wobble;

    const taper = 0.55 + 0.45 * sin(PI * t);
    const w = thick * taper * random(0.85, 1.15);

    stamp(
      g, img, x, y,
      w * random(1, 1.6), w,
      ang + random(-0.4, 0.4),
      alpha
    );
  }
}


// A loose cluster of stamps around a point.
function blot(g, x, y, r, alpha = 60) {

  const n = floor(random(4, 9));

  for (let i = 0; i < n; i++) {

    const a = random(TWO_PI);
    const rr = r * random(0, 0.6);
    const s = r * random(0.8, 1.6);

    stamp(
      g, random(blotBrushes),
      x + cos(a) * rr, y + sin(a) * rr,
      s, s, random(TWO_PI),
      alpha
    );
  }
}


// Fill a rectangle with horizontal strokes.
function fillRect(g, x1, y1, x2, y2, thick, alpha) {

  const rows = max(1, ceil((y2 - y1) / (thick * 0.45)));

  for (let r = 0; r <= rows; r++) {

    const y = lerp(y1, y2, r / rows) + random(-3, 3);

    washStroke(
      g,
      x1 + random(-6, 6), y + random(-4, 4),
      x2 + random(-6, 6), y + random(-4, 4),
      thick, alpha
    );
  }
}


function baseWash(strength = 0.3) {

  // The lightest pigment, as a faint all-over ground.
  let k = 0;

  for (let i = 1; i < pigments.length; i++) {
    if (pigments[i].lum > pigments[k].lum) {
      k = i;
    }
  }

  brushPass(k, strength, g => fillRect(g, -20, -10, GW + 20, GH + 10, 90, 22));

  return k;
}


function randomPigment(avoidDark = true) {

  const dark = darkestPigmentIndex();

  let k = floor(random(pigments.length));

  if (avoidDark && k === dark && pigments.length > 2 && random() < 0.7) {
    k = (k + 1 + floor(random(pigments.length - 1))) % pigments.length;
  }

  return k;
}


// --------------------------------------------------
// Compositions
// --------------------------------------------------

// Stacked horizontal bands, lightest at top, with a dark
// horizon line and sometimes a sun.
function composeHorizon() {

  const order = pigments
    .map((p, k) => k)
    .sort((a, b) => pigments[b].lum - pigments[a].lum);

  const dark = darkestPigmentIndex();
  const bands = order.filter(k => k !== dark);

  // Random band heights that fill the page.
  const weights = bands.map(() => random(0.6, 1.4));
  const total = weights.reduce((a, b) => a + b, 0);

  let y = -10;

  bands.forEach((k, b) => {

    const h = (weights[b] / total) * (GH + 20);
    const y1 = y - h * 0.12;
    const y2 = y + h * 1.12;

    brushPass(k, random(0.55, 0.9), g =>
      fillRect(g, -20, y1, GW + 20, y2, constrain(h * 0.6, 25, 110), 26)
    );

    y += h;
  });

  // Horizon: a thin dark line across the lower half.
  const hy = GH * random(0.5, 0.75);

  brushPass(dark, random(0.5, 0.8), g => {
    washStroke(g, -20, hy, GW + 20, hy + random(-15, 15), random(10, 22), 34);
  });

  const accent = pigmentIndexByRole("accent");

  if (accent >= 0 && random() < 0.75) {
    brushPass(accent, random(0.6, 0.9), g =>
      blot(g, GW * random(0.2, 0.8), hy * random(0.3, 0.7), random(18, 40), 70)
    );
  }
}


// Big gestural strokes leaning one way.
function composeGesture() {

  baseWash(0.3);

  const n = floor(random(5, 10));
  const lean = random(-PI / 3, PI / 3);

  for (let i = 0; i < n; i++) {

    const k = randomPigment();

    const cx = GW * random(0.15, 0.85);
    const cy = GH * random(0.15, 0.85);
    const len = GW * random(0.35, 0.85);
    const a = lean + random(-0.5, 0.5);

    brushPass(k, random(0.55, 1), g =>
      washStroke(
        g,
        cx - cos(a) * len / 2, cy - sin(a) * len / 2,
        cx + cos(a) * len / 2, cy + sin(a) * len / 2,
        random(25, 80), 30
      )
    );
  }
}


// Soft stacked rectangles, a little Rothko.
function composeBlocks() {

  const ground = baseWash(0.45);

  const n = floor(random(2, 4));
  const margin = GW * random(0.08, 0.16);
  const gap = GH * random(0.03, 0.07);

  const blockH = (GH - margin * 1.2 - gap * (n - 1)) / n;

  let y = margin * 0.6;

  const used = [ground];

  for (let b = 0; b < n; b++) {

    let k = randomPigment(b !== n - 1);

    if (used.includes(k) && pigments.length > used.length) {
      k = pigments.map((p, i) => i).find(i => !used.includes(i));
    }

    used.push(k);

    const y1 = y;
    const y2 = y + blockH * random(0.8, 1.05);

    brushPass(k, random(0.6, 0.95), g =>
      fillRect(g, margin, y1, GW - margin, y2, 45, 30)
    );

    y += blockH + gap;
  }
}


// Scattered blots and splatters.
function composeBlooms() {

  baseWash(0.25);

  const n = floor(random(22, 40));

  for (let i = 0; i < n; i++) {

    const k = randomPigment();

    brushPass(k, random(0.5, 1), g =>
      blot(g, random(GW), random(GH), random(20, 85), random(50, 90))
    );
  }
}
