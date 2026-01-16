// -----------------------------------------------
// p5.js sketch: Multi‐Image “Morph” Exploded Grid
// Uses direct UV mapping, no createGraphics/mask
// -----------------------------------------------

let imgA, imgB;
let slices = [];

// UI elements
let cellSlider;    // tile size (pixels)
let borderSlider;  // white‐border thickness (pixels)
let sizeToggle;    // uniform vs. random ±50% scaling
let zSlider;       // max Z‐offset for explosion
let mixSlider;     // mix between Image A and Image B (0 → 1)

function preload() {
  // ─── Replace these with your own image paths/URLs (same dimensions!) ───
  imgA = loadImage('../images/eclipse.jpg');
  imgB = loadImage('../images/fracture.png');
}

function setup() {
  createCanvas(800, 800, WEBGL);
  noStroke();

  // ─── “Cell Size” slider (10px → 200px, default 50px) ───
  cellSlider = createSlider(10, 200, 50, 1);
  cellSlider.style('width', '150px');
  cellSlider.position(10, 10);
  cellSlider.input(buildGrid);

  // ─── “Border Width” slider (0px → 50px, default 5px) ───
  borderSlider = createSlider(0, 50, 5, 1);
  borderSlider.style('width', '150px');
  borderSlider.position(10, 40);
  // (We do NOT rebuild the grid when this changes.)

  // ─── “Varied Size” checkbox ───
  // OFF → each tile draws at baseSize × 1.0
  // ON  → each tile’s size = baseSize × random(0.5 … 1.5)
  sizeToggle = createCheckbox('Varied Size', false);
  sizeToggle.position(10, 70);
  sizeToggle.changed(applyVariedSizes);

  // ─── “Max Z” slider (0px → 500px, default 200px) ───
  // Tiles get z ∈ [–maxZ … +maxZ]; setting 0 flattens back to the 2D image
  zSlider = createSlider(0, 500, 200, 1);
  zSlider.style('width', '150px');
  zSlider.position(10, 100);
  zSlider.input(updateZPositions);

  // ─── “Mix” slider (0 → 100, default 0) ───
  // 0% = fully Image A; 100% = fully Image B
  mixSlider = createSlider(0, 100, 0, 1);
  mixSlider.style('width', '150px');
  mixSlider.position(10, 130);

  // Build the initial grid of slices
  buildGrid();
}

function buildGrid() {
  slices = [];
  let baseSize = cellSlider.value();
  let maxZ     = zSlider.value();

  // How many whole tiles fit in width/height?
  let cols = floor(imgA.width  / baseSize);
  let rows = floor(imgA.height / baseSize);
  if (cols < 1 || rows < 1) return;

  // Compute total grid dimensions (for centering)
  let gridW = cols * baseSize;
  let gridH = rows * baseSize;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Center‐position for this slice in WEBGL coordinates:
      let x = (i + 0.5) * baseSize - gridW / 2;
      let y = (j + 0.5) * baseSize - gridH / 2;
      // Random Z in [–maxZ, +maxZ]
      let z = random(-maxZ, maxZ);

      // Compute normalized UV coords for this tile:
      // (i*baseSize, j*baseSize) → ((i+1)*baseSize, (j+1)*baseSize)
      let u0 = (i * baseSize) / imgA.width;
      let v0 = (j * baseSize) / imgA.height;
      let u1 = ((i + 1) * baseSize) / imgA.width;
      let v1 = ((j + 1) * baseSize) / imgA.height;

      slices.push({
        x:        x,
        y:        y,
        z:        z,
        baseSize: baseSize,
        scale:    1.0,    // will change if “Varied Size” is ON
        u0:       u0,     // left UV
        v0:       v0,     // top  UV
        u1:       u1,     // right UV
        v1:       v1      // bottom UV
      });
    }
  }

  // If “Varied Size” was already checked, randomize scales now:
  if (sizeToggle.checked()) {
    applyVariedSizes();
  }
}

function applyVariedSizes() {
  if (sizeToggle.checked()) {
    for (let s of slices) {
      s.scale = random(0.5, 1.5);
    }
  } else {
    for (let s of slices) {
      s.scale = 1.0;
    }
  }
}

function updateZPositions() {
  let maxZ = zSlider.value();
  for (let s of slices) {
    s.z = random(-maxZ, maxZ);
  }
}

function draw() {
  background(30);

  // Click‐drag in the blank area → orbit/zoom the 3D scene
  orbitControl();

  // Soft ambient light so textures aren’t pitch‐black
  ambientLight(50);

  let border = borderSlider.value();
  let mixPct = mixSlider.value() / 100.0; // 0 → 1

  for (let s of slices) {
    // Final draw‐size = baseSize × scale
    let drawSize = s.baseSize * s.scale;
    let half     = drawSize / 2;

    // 1) White border‐rectangle behind the tile (if border > 0)
    if (border > 0) {
      push();
      translate(s.x, s.y, s.z);
      noStroke();
      fill(255);
      plane(drawSize + 2 * border, drawSize + 2 * border);
      pop();
    }

    // 2a) Draw Image A quad with alpha = (1 – mixPct)
    push();
    translate(s.x, s.y, s.z + 0.1); // 0.1 forward to avoid z‐fighting
    noStroke();
    tint(255, (1 - mixPct) * 255);
    beginShape();
    texture(imgA);
    // 4 vertices of the quad, with corresponding UVs:
    vertex(-half, -half,  s.u0, s.v0);
    vertex( half, -half,  s.u1, s.v0);
    vertex( half,  half,  s.u1, s.v1);
    vertex(-half,  half,  s.u0, s.v1);
    endShape(CLOSE);
    pop();

    // 2b) Draw Image B quad with alpha = mixPct
    push();
    translate(s.x, s.y, s.z + 0.1);
    noStroke();
    tint(255, mixPct * 255);
    beginShape();
    texture(imgB);
    vertex(-half, -half,  s.u0, s.v0);
    vertex( half, -half,  s.u1, s.v0);
    vertex( half,  half,  s.u1, s.v1);
    vertex(-half,  half,  s.u0, s.v1);
    endShape(CLOSE);
    pop();

    // Reset tint so it doesn’t leak to other objects
    noTint();
  }

  // ─── Draw UI overlay in true 2D space (top‐left) ───
  resetMatrix();
  push();
  translate(-width / 2, -height / 2);

  noStroke();
  fill(0, 150);
  rect(10, 10, 300, 170);

  fill(255);
  textSize(14);
  text(`Tile Size: ${cellSlider.value()} px`,          20,  30);
  text(`Border: ${border} px`,                         20,  55);
  text(`Varied Size: ${sizeToggle.checked() ? 'ON' : 'OFF'}`, 20,  80);
  text(`Max Z: ${zSlider.value()} px`,                 20, 105);
  text(`Mix (A → B): ${(mixPct * 100).toFixed(0)}%`,    20, 130);
  pop();
}
