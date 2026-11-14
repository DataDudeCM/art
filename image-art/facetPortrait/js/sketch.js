// Facet Portrait. Steps 1 and 2: planes and tone.
// A photo goes in, the face is found, the head is cut into facets,
// and each facet is hatched by how dark the photo is there.

import { initFace, detectLandmarks, keyPoints } from "./face.js";
import { buildFacets } from "./facets.js";
import { makeSampler, addTones } from "./tone.js";

const TEST_PHOTO = "photos/test.jpg";   // loaded at start if it exists
const PANEL_W = 230;

// Hatching, in screen pixels.
const HATCH_GAP = 9;        // between lines at level 1 and 2
const SOLID_GAP = 3.5;      // between lines at level 3
const CROSS_TURN = 1.15;    // radians between the two directions of a cross-hatch

const params = new URLSearchParams(location.search);

const state = {
  photo: null,        // HTMLImageElement
  points: null,       // key points in photo pixels
  outline: null,      // indices into points
  features: null,     // { name: [index into points] }
  facets: null,
  seed: Number(params.get("seed")) || 1,
  target: Number(params.get("facets")) || 22,
  sampler: null,      // (x, y) -> brightness of the photo
  showPhoto: params.get("photo") !== "0",
  showHatch: params.get("hatch") !== "0",
  showPoints: params.get("points") === "1",
  ready: false
};
window.facetPortrait = state;   // for the console and for tests

const el = id => document.getElementById(id);

window.setup = function () {
  createCanvas(400, 500).parent("stage");
  pixelDensity(1);
  noLoop();

  el("facets").value = state.target;
  el("showPhoto").checked = state.showPhoto;
  el("showHatch").checked = state.showHatch;
  el("showPoints").checked = state.showPoints;
  refreshLabels();

  el("file").addEventListener("change", e => {
    if (e.target.files[0]) loadPhoto(URL.createObjectURL(e.target.files[0]));
  });
  el("facets").addEventListener("input", e => {
    state.target = Number(e.target.value);
    rebuild();
  });
  el("newSeed").addEventListener("click", newSeed);
  el("showPhoto").addEventListener("change", e => {
    state.showPhoto = e.target.checked;
    redraw();
  });
  el("showHatch").addEventListener("change", e => {
    state.showHatch = e.target.checked;
    redraw();
  });
  el("showPoints").addEventListener("change", e => {
    state.showPoints = e.target.checked;
    redraw();
  });

  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadPhoto(URL.createObjectURL(file));
  });

  start();
};

async function start() {
  setStatus("Loading face finder...");
  try {
    await initFace();
  } catch (err) {
    console.error(err);
    setStatus("Could not load the face finder. It needs an internet connection.");
    return;
  }
  setStatus("Choose or drop a portrait photo.");
  loadPhoto(TEST_PHOTO, true);
}

function loadPhoto(url, quiet = false) {
  const img = new Image();
  img.onload = () => {
    state.photo = img;
    state.sampler = makeSampler(img);
    const lm = detectLandmarks(img);
    if (!lm) {
      state.points = state.facets = null;
      setStatus("No face found in that photo.");
    } else {
      const kp = keyPoints(lm, img.naturalWidth, img.naturalHeight);
      state.points = kp.points;
      state.outline = kp.outline;
      state.features = kp.features;
      rebuild();
    }
    fitCanvas();
    state.ready = true;
  };
  img.onerror = () => {
    if (!quiet) setStatus("Could not load that image.");
  };
  img.src = url;
}

function rebuild() {
  if (!state.points) return;
  state.facets = buildFacets(
    state.points, state.outline, state.features, state.target, state.seed
  );
  addTones(state.points, state.facets, state.sampler, state.seed);
  const planes = state.facets.filter(f => !f.feature).length;
  setStatus(planes + " planes, plus eyes, nose and mouth");
  refreshLabels();
  redraw();
}

function newSeed() {
  state.seed = Math.floor(Math.random() * 1e6) + 1;
  rebuild();
}

function fitCanvas() {
  if (!state.photo) return;
  const iw = state.photo.naturalWidth;
  const ih = state.photo.naturalHeight;
  const s = Math.min((windowWidth - PANEL_W) / iw, windowHeight / ih);
  resizeCanvas(Math.floor(iw * s), Math.floor(ih * s));
  redraw();
}

window.windowResized = fitCanvas;

window.keyPressed = function () {
  if (key === "n" || key === "N") newSeed();
  if (key === "p" || key === "P") {
    state.showPhoto = !state.showPhoto;
    el("showPhoto").checked = state.showPhoto;
    redraw();
  }
  if (key === "h" || key === "H") {
    state.showHatch = !state.showHatch;
    el("showHatch").checked = state.showHatch;
    redraw();
  }
  if (key === "o" || key === "O") {
    state.showPoints = !state.showPoints;
    el("showPoints").checked = state.showPoints;
    redraw();
  }
};

window.draw = function () {
  background(250, 248, 244);
  if (!state.photo) return;

  const s = width / state.photo.naturalWidth;

  if (state.showPhoto) {
    drawingContext.save();
    drawingContext.globalAlpha = 0.45;
    drawingContext.filter = "grayscale(1)";
    drawingContext.drawImage(state.photo, 0, 0, width, height);
    drawingContext.restore();
  }

  if (!state.facets) return;

  push();
  scale(s);

  // Feature shapes first, tinted: these become the eyes, nose and mouth.
  strokeJoin(ROUND);
  noStroke();
  fill(40, 110, 200, 60);
  for (const f of state.facets) {
    if (f.feature) drawLoop(f.loop);
  }

  // Hatching.
  if (state.showHatch) {
    stroke(35, 35, 40, 190);
    strokeWeight(1 / s);
    for (const f of state.facets) {
      if (f.feature || !f.level) continue;
      if (f.level === 1) {
        hatch(f, f.angle, HATCH_GAP / s);
      } else if (f.level === 2) {
        hatch(f, f.angle, HATCH_GAP / s);
        hatch(f, f.angle + CROSS_TURN, HATCH_GAP / s);
      } else {
        hatch(f, f.angle, SOLID_GAP / s);
        hatch(f, f.angle + CROSS_TURN, SOLID_GAP / s);
      }
    }
  }

  // Plane edges.
  noFill();
  stroke(20);
  strokeWeight(2.2 / s);
  for (const f of state.facets) drawLoop(f.loop);

  if (state.showPoints) {
    textSize(11 / s);
    for (const p of state.points) {
      noStroke();
      fill(200, 30, 30);
      circle(p.x, p.y, 6 / s);
      text(p.id, p.x + 5 / s, p.y - 4 / s);
    }
  }
  pop();
};

// Fills a plane with parallel lines at the given angle and gap.
function hatch(f, angle, gap) {
  const pts = f.loop.map(i => state.points[i]);
  const dx = Math.cos(angle), dy = Math.sin(angle);   // along the lines
  const nx = -dy, ny = dx;                            // across them

  // How far the plane reaches along and across the hatch direction.
  let minA = Infinity, maxA = -Infinity, minN = Infinity, maxN = -Infinity;
  for (const p of pts) {
    const a = p.x * dx + p.y * dy;
    const n = p.x * nx + p.y * ny;
    minA = Math.min(minA, a); maxA = Math.max(maxA, a);
    minN = Math.min(minN, n); maxN = Math.max(maxN, n);
  }

  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();

  for (let n = minN + gap / 2; n < maxN; n += gap) {
    line(
      nx * n + dx * minA, ny * n + dy * minA,
      nx * n + dx * maxA, ny * n + dy * maxA
    );
  }
  ctx.restore();
}

function drawLoop(loop) {
  beginShape();
  for (const i of loop) vertex(state.points[i].x, state.points[i].y);
  endShape(CLOSE);
}

function refreshLabels() {
  el("facetsValue").textContent = state.target;
  el("seedValue").textContent = state.seed;
}

function setStatus(msg) {
  el("status").textContent = msg;
}
