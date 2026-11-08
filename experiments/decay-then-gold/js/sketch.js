// Decay, then Gold
// A portrait decays by one rule, then a single repair pass draws gold along the edges of the losses.
// Rule: a cell's chance of dying rises with the number of its dead neighbors.

const MAX_SIZE = 800;       // longest canvas side in px
const CELL = 4;             // grid cell size in px (smaller = less blocky, slower)
const GENERATIONS = 60;     // decay steps before stopping
const PER_NEIGHBOR = 0.05;  // chance of dying per dead neighbor, per generation
const NOISE_SCALE = 0.05;   // how fast the decay "weather" varies across the image
const SEED = 1847;          // same seed + same image = same result
const PAPER = '#efe9dd';    // what shows through the losses
const GOLD = '#c9a227';

let img, cols, rows, alive;
let gen = 0, running = false, gilded = false;

function setup() {
  const c = createCanvas(MAX_SIZE, MAX_SIZE);
  c.parent('canvas-container');
  c.drop(gotFile);
  pixelDensity(1);
  background(40);
  noLoop();
}

function gotFile(file) {
  if (file.type !== 'image') return status('That isn’t an image. Drop a portrait (JPG or PNG).');
  loadImage(file.data, start);
}

function start(loaded) {
  img = loaded;
  const s = MAX_SIZE / max(img.width, img.height);
  img.resize(floor(img.width * s / CELL) * CELL, floor(img.height * s / CELL) * CELL);
  resizeCanvas(img.width, img.height, true);   // no redraw yet: reset() builds the grid and redraws
  cols = img.width / CELL;
  rows = img.height / CELL;
  reset();
}

function reset() {
  if (!img) return;
  randomSeed(SEED);
  noiseSeed(SEED);
  alive = new Uint8Array(cols * rows).fill(1);
  gen = 0;
  gilded = false;
  running = false;
  killDisc(strongestEdge(), 2);   // one starting hole at the strongest edge
  redraw();
}

// Brightness at the center of a cell (0–255).
function lum(cx, cy) {
  const c = img.get(cx * CELL + CELL / 2, cy * CELL + CELL / 2);
  return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

// The cell with the biggest brightness jump to its right/lower neighbor, away from the border.
function strongestEdge() {
  let best = 0, bestI = floor(rows / 2) * cols + floor(cols / 2);
  for (let y = 4; y < rows - 4; y += 2) {
    for (let x = 4; x < cols - 4; x += 2) {
      const l = lum(x, y);
      const g = abs(l - lum(x + 1, y)) + abs(l - lum(x, y + 1));
      if (g > best) { best = g; bestI = y * cols + x; }
    }
  }
  return bestI;
}

function killDisc(i, r) {
  const cx = i % cols, cy = floor(i / cols);
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if (x >= 0 && y >= 0 && x < cols && y < rows && dist(x, y, cx, cy) <= r) alive[y * cols + x] = 0;
}

function deadNeighbors(x, y) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !alive[ny * cols + nx]) n++;
    }
  return n;
}

// One generation. Reads the old state, writes a new one, so order doesn't matter.
function step() {
  const next = alive.slice();
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (!alive[i]) continue;
      const n = deadNeighbors(x, y);
      if (!n) continue;
      const weather = 0.4 + 1.2 * noise(x * NOISE_SCALE, y * NOISE_SCALE);
      if (random() < n * PER_NEIGHBOR * weather) next[i] = 0;
    }
  alive = next;
  gen++;
}

// The repair: a gold seam along every edge where a lost cell meets a surviving one.
function drawGold() {
  stroke(GOLD);
  strokeWeight(max(1.5, CELL * 0.5));
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (alive[y * cols + x]) continue;
      const px = x * CELL, py = y * CELL;
      if (x > 0 && alive[y * cols + x - 1]) line(px, py, px, py + CELL);
      if (x < cols - 1 && alive[y * cols + x + 1]) line(px + CELL, py, px + CELL, py + CELL);
      if (y > 0 && alive[(y - 1) * cols + x]) line(px, py, px + CELL, py);
      if (y < rows - 1 && alive[(y + 1) * cols + x]) line(px, py + CELL, px + CELL, py + CELL);
    }
}

function draw() {
  if (!img) return;
  if (running) {
    step();
    if (gen >= GENERATIONS) { running = false; noLoop(); }
  }
  image(img, 0, 0);
  noStroke();
  fill(PAPER);
  for (let i = 0; i < alive.length; i++)
    if (!alive[i]) rect((i % cols) * CELL, floor(i / cols) * CELL, CELL, CELL);
  if (gilded) drawGold();
  status(`Generation ${gen} / ${GENERATIONS}${gilded ? ' · gold' : ''}${running ? ' · running' : ''}`);
}

function keyPressed() {
  if (!img) return;
  if (key === ' ') { running = !running && gen < GENERATIONS; running ? loop() : noLoop(); redraw(); }
  if (key === 'n' || key === 'N') { if (gen < GENERATIONS) step(); redraw(); }
  if (key === 'g' || key === 'G') { gilded = !gilded; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(`decay-then-gold-gen${gen}${gilded ? '-gold' : ''}`, 'png');
  if (key === 'r' || key === 'R') reset();
  return false;
}

function mousePressed() {
  if (!img || mouseX < 0 || mouseY < 0 || mouseX >= width || mouseY >= height) return;
  killDisc(floor(mouseY / CELL) * cols + floor(mouseX / CELL), 2);
  redraw();
}

function status(msg) {
  document.getElementById('status').textContent = msg;
}
