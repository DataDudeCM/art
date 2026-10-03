// sketch.js
//
// Rain Worn
//
// A painting in two acts. A brush lays down a composition,
// then it rains on it. The rain decides what the painting
// becomes: streaks, lifted channels, tide-lines, pigment
// washed off the edge of the page.
//
// Controls:
//   drag        paint wet pigment
//   1-9         choose pigment
//   arrows      tilt the board (Shift + arrow = steeper)
//   0           level the board
//   space       pause / resume rain (resumes for another storm when dry)
//   hold B      show the painting before the rain
//   C           same seed, next composition
//   R           new painting
//   S           save PNG
//   H           hide panel


const GW = 500;      // simulation grid
const GH = 350;
const SCALE = 2;     // canvas = grid * SCALE

const PAPER = {
  toothRelief: 0.18,
  cockleRelief: 3
};

const DROP = {
  maxSteps: 90,
  inertia: 0.5,
  capacity: 6,
  minSlope: 0.004,
  deposit: 0.25,
  erode: 0.65,
  maxLift: 0.3,
  dryLift: 0.25,       // lift multiplier on dry paper (wet adds up to +1)
  evaporate: 0.03,
  gravity: 6,
  maxSpeed: 4,
  uphillDeposit: 6,
  granulation: 0.8,    // lower = pigment settles harder into paper pits
  crowding: 1.5,       // how strongly thick paint refuses more deposit
  wetting: 0.3
};

const RAIN = {
  dropsPerFrame: 30,
  stormLength: 70000,
  bigDropChance: 0.05,
  dryRate: 0.994
};

const RENDER = {
  wetDeepen: 0.18,
  wetDarken: 0.05
};

const TILT_STEP = 0.008;


let seed;
let paletteKey;
let compositionMode;

let raining = true;
let stormEnd = 0;
let currentPigment = 0;
let showPanel = true;

let paintImage;
let grainLayer;


// --------------------------------------------------
// SETUP
// --------------------------------------------------

function preload() {
  preloadBrushes();
}


function setup() {

  pixelDensity(1);

  createCanvas(GW * SCALE, GH * SCALE);

  paintImage = createImage(GW, GH);

  grainLayer = makeGrainLayer();

  const urlSeed = parseInt(new URLSearchParams(location.search).get("seed"));

  generate(Number.isFinite(urlSeed) ? urlSeed : floor(Math.random() * 1000000));
}


// --------------------------------------------------
// DRAW
// --------------------------------------------------

function draw() {

  if (raining && dropsFallen < stormEnd) {

    // Showers come and go.
    const intensity = 0.25 + 1.5 * noise(frameCount * 0.006, 77);

    rainStep(floor(RAIN.dropsPerFrame * intensity));

  } else if (raining) {
    raining = false;
  }

  if (mouseIsPressed && mouseInCanvas()) {
    paintAt(mouseX / SCALE, mouseY / SCALE);
  }

  dryOut();

  const before = keyIsDown(66); // B

  renderPigments(
    paintImage,
    before ? pigmentSnapshot : pigments.map(p => p.density),
    before ? dryWetness : wetness
  );

  image(paintImage, 0, 0, width, height);
  image(grainLayer, 0, 0);

  if (frameCount % 10 === 0) {
    updateStatus(before);
  }
}


// --------------------------------------------------
// GENERATION
// --------------------------------------------------

function generate(newSeed, mode = null) {

  seed = newSeed;

  randomSeed(seed);
  noiseSeed(seed);

  paletteKey = random(getPaletteNames());

  compositionMode = mode || random(Object.keys(COMPOSITIONS));

  // Each painting gets its own lean; you can change it live.
  const a = HALF_PI + random(-0.6, 0.6);
  const t = TILT_STEP * random(1, 2.2);
  tiltX = cos(a) * t;
  tiltY = sin(a) * t;

  buildPaper();
  setupPigments(getPalette(paletteKey));

  compose(compositionMode);
  snapshotPigments();

  dropsFallen = 0;
  stormEnd = RAIN.stormLength;
  raining = true;
  currentPigment = 0;

  updateStatus(false);

  console.log("Rain Worn", { seed, palette: paletteKey, composition: compositionMode });
}


// Speckled fibre grain at full resolution, drawn over the
// painting so the upscaled grid doesn't look smooth.
function makeGrainLayer() {

  const g = createGraphics(width, height);
  g.pixelDensity(1);
  g.loadPixels();

  for (let j = 0; j < g.pixels.length; j += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.pixels[j] = v;
    g.pixels[j + 1] = v;
    g.pixels[j + 2] = v;
    g.pixels[j + 3] = Math.random() * 16;
  }

  g.updatePixels();

  return g;
}


// --------------------------------------------------
// INTERACTION
// --------------------------------------------------

function paintAt(gx, gy) {

  const r = 9;
  const d = pigments[currentPigment].density;

  for (let y = max(0, floor(gy - r)); y < min(GH, ceil(gy + r)); y++) {
    for (let x = max(0, floor(gx - r)); x < min(GW, ceil(gx + r)); x++) {

      const dd = dist(x, y, gx, gy) / r;

      if (dd >= 1) {
        continue;
      }

      const i = y * GW + x;
      const edge = (1 - dd) * (1 - dd) * (0.6 + 0.4 * noise(x * 0.2, y * 0.2));

      d[i] += 0.06 * edge;
      wetness[i] = Math.min(1, wetness[i] + 0.3 * edge);
    }
  }
}


function mouseInCanvas() {
  return mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
}


function keyPressed() {

  const k = key.toLowerCase();

  if (k === "r") {
    generate(floor(Math.random() * 1000000));
  }

  else if (k === "c") {
    const modes = Object.keys(COMPOSITIONS);
    generate(seed, modes[(modes.indexOf(compositionMode) + 1) % modes.length]);
  }

  else if (k === "s") {
    saveCanvas(`rainWorn_${paletteKey}_${compositionMode}_${seed}`, "png");
  }

  else if (k === "h") {
    showPanel = !showPanel;
    select("#status").style("display", showPanel ? "block" : "none");
  }

  else if (k === " ") {
    if (dropsFallen >= stormEnd) {
      stormEnd = dropsFallen + RAIN.stormLength;
      raining = true;
    } else {
      raining = !raining;
    }
  }

  else if (k === "0") {
    tiltX = 0;
    tiltY = 0;
  }

  else if (k >= "1" && k <= "9") {
    const n = int(k) - 1;
    if (n < pigments.length) {
      currentPigment = n;
    }
  }

  const step = keyIsDown(SHIFT) ? TILT_STEP * 3 : TILT_STEP;

  if (keyCode === LEFT_ARROW) tiltX -= step;
  if (keyCode === RIGHT_ARROW) tiltX += step;
  if (keyCode === UP_ARROW) tiltY -= step;
  if (keyCode === DOWN_ARROW) tiltY += step;

  updateStatus(false);

  // Keep arrows and space from scrolling the page.
  return ![32, 37, 38, 39, 40].includes(keyCode);
}


// --------------------------------------------------
// STATUS
// --------------------------------------------------

function updateStatus(before) {

  const el = document.getElementById("status");

  if (!el || !showPanel) {
    return;
  }

  const swatches = pigments
    .map((p, i) =>
      `<span class="swatch${i === currentPigment ? " current" : ""}" ` +
      `style="background:${p.hex}" title="${i + 1}: ${p.role}"></span>`
    )
    .join("");

  let weather;

  if (before) {
    weather = "before the rain";
  } else if (raining) {
    weather = `raining · ${dropsFallen.toLocaleString()} drops`;
  } else if (dropsFallen < stormEnd) {
    weather = "paused";
  } else {
    weather = maxWetness() > 0.05 ? "drying" : "dry";
  }

  el.innerHTML =
    `<strong>Rain Worn v0.1</strong><br>` +
    `${getPalette(paletteKey).name} · ${compositionMode} · seed ${seed}<br>` +
    `${swatches}<br>` +
    `${weather} · tilt ${tiltArrow()}<br>` +
    `<span class="keys">drag paint · 1-9 pigment · arrows tilt · space rain<br>` +
    `hold B before · C composition · R new · S save · H hide</span>`;
}


function tiltArrow() {

  const m = Math.hypot(tiltX, tiltY);

  if (m < 1e-6) {
    return "level";
  }

  const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
  const i = Math.round(Math.atan2(tiltY, tiltX) / (Math.PI / 4));

  return arrows[(i + 8) % 8] + " " + (m / TILT_STEP).toFixed(1);
}


function maxWetness() {
  let m = 0;
  for (let i = 0; i < wetness.length; i += 7) {
    if (wetness[i] > m) m = wetness[i];
  }
  return m;
}
