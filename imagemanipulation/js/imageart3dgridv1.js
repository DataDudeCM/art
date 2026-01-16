let img;
let slices = [];

// Sliders
let cellSlider;
let borderSlider;

// How deep (Z‐offset) each tile can go
let zRange = 200;

function preload() {
  // ── Replace this with your own image path or URL ──
  img = loadImage('../images/jinx2.png');
}

function setup() {
  createCanvas(800, 800, WEBGL);
  noStroke();

  // ── Create the “Cell Size” slider (10px → 200px) ──
  cellSlider = createSlider(10, 200, 50, 1);
  cellSlider.style('width', '150px');
  // We position it in screen space, not WEBGL space, so use createDiv/position()
  cellSlider.position(10, 10);
  cellSlider.input(buildSlices);

  // ── Create the “Border Width” slider (0px → 50px) ──
  borderSlider = createSlider(0, 50, 5, 1);
  borderSlider.style('width', '150px');
  borderSlider.position(10, 40);

  // Build the initial slices
  buildSlices();
}

function buildSlices() {
  slices = [];
  let cellSize = cellSlider.value();

  // How many columns/rows fit?
  let cols = floor(img.width / cellSize);
  let rows = floor(img.height / cellSize);

  // If the cell size is too big, stop here
  if (cols < 1 || rows < 1) {
    return;
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Center the grid at (0,0) in WEBGL space:
      let x = (i - cols / 2 + 0.5) * cellSize;
      let y = (j - rows / 2 + 0.5) * cellSize;
      let z = random(-zRange, zRange);

      // Create an offscreen buffer (p5.Graphics) just for this tile
      let tile = createGraphics(cellSize, cellSize);
      tile.image(
        img,
        0,
        0,               // draw at (0,0) in the tile
        cellSize,
        cellSize,        // draw size = cellSize × cellSize
        i * cellSize,    // source x in the original image
        j * cellSize,    // source y in the original image
        cellSize,
        cellSize         // source width/height
      );

      slices.push({ img: tile, x, y, z, cellSize });
    }
  }
}

function draw() {
  background(30);

  // Allow mouse to orbit & zoom the 3D scene
  orbitControl();

  // Simple ambient light so textures don’t look totally flat
  ambientLight(200);

  // Read the current border width
  let border = borderSlider.value();

  // Draw each slice:
  // 1) White plane for the border (slightly larger)
  // 2) Textured plane “in front” by 0.1 units
  for (let s of slices) {
    if (border > 0) {
      push();
      translate(s.x, s.y, s.z);
      noStroke();
      fill(255);
      plane(s.cellSize + 2 * border, s.cellSize + 2 * border);
      pop();
    }

    push();
    translate(s.x, s.y, s.z + 0.1);
    noStroke();
    texture(s.img);
    plane(s.cellSize, s.cellSize);
    pop();
  }

  // Finally, draw slider labels in 2D screen‐space so they’re always on top
  resetMatrix();
  // Switch to normal (2D) drawing
  push();
  // Draw background behind the text so it’s legible
  noStroke();
  fill(0, 150); // semi-transparent black
  rect(0, 0, 200, 50);
  fill(255);
  textSize(14);
  text(`Cell Size: ${cellSlider.value()} px`, 10, 20);
  text(`Border: ${borderSlider.value()} px`, 10, 40);
  pop();
}
