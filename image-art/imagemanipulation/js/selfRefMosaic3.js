/*
  Interactive Brightness Mosaic
  1. Upload Source & Target
  2. Use Slider to adjust abstraction level (Tile Size)
  3. System redraws automatically on slider release
*/

let sourceImg, targetImg;
let tiles = [];
let tileSizeSlider;
let sizeLabel;
let tileSize = 50; // Starting default

function setup() {
  // 1. Create a fixed UI container at the top
  let uiContainer = createDiv('').style('padding', '10px').style('background', '#222').style('color', '#FFF').style('font-family', 'sans-serif');
  
  // Title
  let title = createElement('h3', 'Code Artist: Texture Transfer Engine').parent(uiContainer).style('margin', '0 0 10px 0');
  
  // Instructions
  createP('Step 1: Upload Source Texture').parent(uiContainer).style('margin', '5px 0');
  let inputSource = createFileInput(handleSource).parent(uiContainer);
  
  createP('Step 2: Upload Target Canvas').parent(uiContainer).style('margin', '15px 0 5px 0');
  let inputTarget = createFileInput(handleTarget).parent(uiContainer);
  
  // Slider Section
  createP('Step 3: Adjust Abstraction (Tile Size)').parent(uiContainer).style('margin', '15px 0 5px 0');
  
  // Slider: Min 10, Max 200, Start 50, Step 5
  tileSizeSlider = createSlider(10, 200, 50, 5).parent(uiContainer);
  tileSizeSlider.style('width', '300px');
  
  // Label to show current size
  sizeLabel = createSpan('Current Size: 50px').parent(uiContainer).style('margin-left', '10px');
  
  // EVENT LISTENER: Only runs when user *finishes* moving the slider
  tileSizeSlider.changed(updateSystem);
  
  // LIVE UPDATE: Updates the text label while dragging (but doesn't compute)
  tileSizeSlider.input(() => {
    sizeLabel.html(`Current Size: ${tileSizeSlider.value()}px`);
  });

  // Create the main canvas below the UI
  createCanvas(800, 400);
  background(50);
  fill(150);
  noStroke();
  textAlign(CENTER, CENTER);
  text("Waiting for uploads...", width/2, height/2);
}

// --- CORE LOGIC ---

function updateSystem() {
  // 1. Update the global variable
  tileSize = tileSizeSlider.value();
  console.log(`Resizing system to tiles: ${tileSize}px`);
  
  // 2. If we have a source, we must re-slice it because the grid changed
  if (sourceImg) {
    processSourceTiles();
  }
  
  // 3. If we have a target, we redraw it with the new tiles
  if (targetImg) {
    drawMosaic();
  }
}

function handleSource(file) {
  if (file.type === 'image') {
    sourceImg = loadImage(file.data, () => {
      console.log(`Source Loaded`);
      processSourceTiles();
      // If target is already there, auto-refresh the art
      if (targetImg) drawMosaic();
    });
  }
}

function handleTarget(file) {
  if (file.type === 'image') {
    targetImg = loadImage(file.data, () => {
      console.log(`Target Loaded`);
      // Resize canvas to fit the art
      targetImg.resize(targetImg.width*3, targetImg.height*3);
      resizeCanvas(targetImg.width, targetImg.height);
      drawMosaic();
    });
  }
}

function processSourceTiles() {
  if (!sourceImg) return;
  
  tiles = []; 
  let w = sourceImg.width;
  let h = sourceImg.height;
  
  // Critical Optimization: accessing pixels directly
  sourceImg.loadPixels();
  
  for (let y = 0; y <= h - tileSize; y += tileSize) {
    for (let x = 0; x <= w - tileSize; x += tileSize) {
      
      let tile = sourceImg.get(x, y, tileSize, tileSize);
      
      // Calculate Average Brightness of this tile
      tile.loadPixels();
      let sum = 0;
      // Sampling optimization (check every 10th pixel for speed)
      let step = 10; 
      let count = 0;
      
      for (let i = 0; i < tile.pixels.length; i += 4 * step) {
        let r = tile.pixels[i];
        let g = tile.pixels[i+1];
        let b = tile.pixels[i+2];
        sum += (0.299*r + 0.587*g + 0.114*b);
        count++;
      }
      
      let avg = sum / count;
      
      tiles.push({ img: tile, b: avg });
    }
  }
  
  // Sort by brightness
  tiles.sort((a, b) => a.b - b.b);
  console.log(`Processed ${tiles.length} texture tiles.`);
}

function drawMosaic() {
  if (!targetImg || tiles.length === 0) return;
  
  background(0); // Clear background
  targetImg.loadPixels();
  
  let cols = floor(targetImg.width / tileSize);
  let rows = floor(targetImg.height / tileSize);
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      
      let px = x * tileSize;
      let py = y * tileSize;
      
      // Get brightness of target area (sample center pixel)
      let centerIdx = 4 * ((py + floor(tileSize/2)) * targetImg.width + (px + floor(tileSize/2)));
      
      if (centerIdx < targetImg.pixels.length - 4) {
        let r = targetImg.pixels[centerIdx];
        let g = targetImg.pixels[centerIdx+1];
        let b = targetImg.pixels[centerIdx+2];
        let targetBright = (0.299*r + 0.587*g + 0.114*b);
        
        // Map to sorted tile
        let mapIdx = floor(map(targetBright, 0, 255, 0, tiles.length - 1));
        mapIdx = constrain(mapIdx, 0, tiles.length - 1);
        
        image(tiles[mapIdx].img, px, py, tileSize, tileSize);
      }
    }
  }
}