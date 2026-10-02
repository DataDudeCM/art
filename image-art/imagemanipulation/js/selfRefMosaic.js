/*
  Brightness Mosaic Generator
  1. Upload Source Image (The Texture/Tileset)
  2. Upload Target Image (The Canvas)
  
  Theory:
  - Deconstructs Image A into a sorted array of "Value Tiles".
  - Reconstructs Image B by replacing its pixels with the matching Value Tile.
*/

let sourceImg, targetImg;
let tiles = [];
let tileSize = 10; // Size of the mosaic tiles
let isProcessing = false;

function setup() {
  createCanvas(800, 400);
  background(20);
  
  // Create UI
  fill(255);
  noStroke();
  textSize(16);
  text("Step 1: Upload Source Image (Texture)", 20, 30);
  
  let inputSource = createFileInput(handleSource);
  inputSource.position(20, 50);
  
  text("Step 2: Upload Target Image (Canvas)", 350, 30);
  let inputTarget = createFileInput(handleTarget);
  inputTarget.position(350, 50);
}

function handleSource(file) {
  if (file.type === 'image') {
    sourceImg = loadImage(file.data, () => {
      processSourceTiles(); // Process immediately upon load
    });
  }
}

function handleTarget(file) {
  if (file.type === 'image') {
    targetImg = loadImage(file.data, () => {
      // Resize canvas to fit the target image
      resizeCanvas(targetImg.width, targetImg.height);
      drawMosaic();
    });
  }
}

function processSourceTiles() {
  tiles = []; // Clear previous tiles
  
  // Resize source to ensure we have enough pixel data but not too much overhead
  // A smaller source image means "coarser" textures in the tiles
  sourceImg.resize(1000, 0); 
  
  let w = sourceImg.width;
  let h = sourceImg.height;
  
  // 1. Slice the image into grid pieces
  for (let y = 0; y < h; y += tileSize) {
    for (let x = 0; x < w; x += tileSize) {
      // Get the subsection of the image
      let tile = sourceImg.get(x, y, tileSize, tileSize);
      
      // Calculate average brightness of this tile
      tile.loadPixels();
      let avgBrightness = 0;
      if (tile.pixels.length > 0) {
        // Simple average of center pixel or full loop
        // For speed, let's sample the center pixel of the tile
        // or loop through all. Let's do a quick loop for accuracy.
        let sum = 0;
        for (let i = 0; i < tile.pixels.length; i += 4) {
          // luminance = 0.299*R + 0.587*G + 0.114*B
          let b = (tile.pixels[i] + tile.pixels[i+1] + tile.pixels[i+2]) / 3;
          sum += b;
        }
        avgBrightness = sum / (tile.pixels.length / 4);
      }
      
      // Store tile and its brightness
      tiles.push({
        img: tile,
        b: avgBrightness
      });
    }
  }
  
  // 2. Sort the tiles by brightness (Dark -> Light)
  // This is the core of your "Sort" idea
  tiles.sort((a, b) => a.b - b.b);
  
  console.log(`Processed ${tiles.length} tiles.`);
  fill(0, 255, 0);
  text("Source Processed!", 20, 100);
}

function drawMosaic() {
  if (!targetImg || tiles.length === 0) return;
  
  targetImg.loadPixels();
  
  // Loop through target image in grid steps
  for (let y = 0; y < targetImg.height; y += tileSize) {
    for (let x = 0; x < targetImg.width; x += tileSize) {
      
      // Get the brightness of the target area
      let c = targetImg.get(x, y);
      let b = brightness(c); // 0-255
      
      // 3. Map Brightness to Tile Index
      // Since tiles are sorted 0..255 by brightness, we can map directly
      let index = floor(map(b, 0, 255, 0, tiles.length - 1));
      
      // Constraint to be safe
      index = constrain(index, 0, tiles.length - 1);
      
      // Draw the matching tile
      image(tiles[index].img, x, y, tileSize, tileSize);
    }
  }
}