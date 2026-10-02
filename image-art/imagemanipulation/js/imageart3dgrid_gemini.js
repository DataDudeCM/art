// Global variable for the image
let img;
// Global array for the grid tiles
let tiles = [];

// --- NEW: Variables for our sliders and their values ---
let tileSizeSlider, borderSlider;
let tileSize = 50;
let borderWidth = 0;

function setup() {
  createCanvas(800, 800, WEBGL);
  background(30);
  frameRate(30);

  // --- SLIDER SETUP ---

  // Tile Size Slider
  createP('Grid Size').position(20, height + 5).style('color', '#FFF');
  tileSizeSlider = createSlider(10, 200, 50, 1); // min, max, start, step
  tileSizeSlider.position(20, height  + 15);
  tileSizeSlider.style('width', '180px');
  // When the slider is moved, call the regenerateGrid function
  tileSizeSlider.input(regenerateGrid);

  // Border Width Slider
  createP('Border Width').position(240, height + 5).style('color', '#FFF');
  borderSlider = createSlider(0, 50, 0, 1); // min, max, start, step
  borderSlider.position(240, height + 15) ;
  borderSlider.style('width', '180px');
  borderSlider.input(regenerateGrid);

  // NoiseScale
  createP('Border Width').position(240, height + 40).style('color', '#FFF');
  noiseScaleSlider = createSlider(50, 1000, 50, 10); // min, max, start, step
  noiseScaleSlider.position(20, height + 45);
  noiseScaleSlider.style('width', '180px');
  noiseScaleSlider.input(regenerateGrid);


  // --- FILE UPLOAD SETUP (from previous step) ---
  const fileInput = createFileInput(handleFile);
  fileInput.position(500, height + 10);
}

/**
 * This function is called when a slider is moved.
 * It checks if an image exists and then re-runs the processing function.
 */
function regenerateGrid() {
  if (img) {
    processImage();
  }
}

/**
 * This function is called when a user selects a file.
 */
function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, processImage);
  } else {
    console.log('Not an image file!');
    img = null;
  }
}

/**
 * This function now reads the slider values before building the grid.
 */
function processImage() {
  console.log('Processing image with new settings...');
  tiles = []; // Clear the old grid

  // --- NEW: Read current values from the sliders ---
  tileSize = tileSizeSlider.value();
  borderWidth = borderSlider.value();
  noiseScale = noiseScaleSlider.value();

  const gridWidth = floor(img.width / tileSize);
  const gridHeight = floor(img.height / tileSize);

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tileImg = img.get(x * tileSize, y * tileSize, tileSize, tileSize);
      tiles.push({
        img: tileImg,
        x: x,
        y: y,
      });
    }
  }
}

/**
 * The draw loop with the Z-fighting fix.
 */
function draw() {
  // Only draw if an image has been loaded
  if (img) {
    background(30);
    orbitControl();

    const time = frameCount * 0.01;
    translate(-img.width / 2, -img.height / 2);

    for (const tile of tiles) {
      push();

      const noiseVal = noise(tile.x * 0.05, tile.y * 0.05, time);
      const z = map(noiseVal, 0, 1, -noiseScale, noiseScale);

      translate(tile.x * tileSize + tileSize / 2, tile.y * tileSize + tileSize / 2, z);
      
      // --- BORDER AND IMAGE DRAWING LOGIC ---
      
      // 1. Draw the black background plane (the border) first.
      noStroke();
      fill(0);
      plane(tileSize);

      // ★★★ THE FIX: Push the drawing context forward by a tiny amount ★★★
      // This separates the two planes and prevents Z-fighting.
      translate(0, 0, 0.1); 

      // 2. Calculate the size of the image plane on top.
      const imagePlaneSize = max(0, tileSize - borderWidth * 2);

      // 3. Draw the textured image plane, which is now slightly in front.
      texture(tile.img);
      box(imagePlaneSize);
      
      pop();
    }
  }
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 'l' || key == 'L') {
    if (isLoopingFlag) {
      isLoopingFlag = false;
      noLoop()
    } else {
      isLoopingFlag = true;
      loop();
    }
  }
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('imageart3d_' + timeStamp + 'png');
    }
}