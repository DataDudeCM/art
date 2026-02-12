/*
  High-Fidelity Brightness Mosaic
  1. Upload Source (High Res Texture)
  2. Upload Target (4000x4000+ allowed)
  
  * Performance Note: Processing 16MP images (4k x 4k) takes a moment.
  * The browser might freeze for 1-2 seconds while it thinks.
*/

let sourceImg, targetImg;
let tiles = [];

// ARTISTIC CONTROL: Change this to control detail.
// For a 4000px image, 40-50 is a good "Tile" size.
// 20 will be very detailed, 100  will be abstract.
//let tileSize = 60; // larger the tilesize, the larger the scale factor should be
let scaleFactor = 4; // How much to upscale the target image for better tile matching. 2-4 is good.
let tileSize = scaleFactor * 10; // We keep the source tiles at a fixed size (e.g. 40x40) for better detail, but we can scale the target up to match that detail.

function setup() {
  // Start with a small placeholder canvas
  createCanvas(1000, 1000);
  background(30);
  
  fill(200);
  noStroke();
  textSize(24);
  textAlign(CENTER, CENTER);
  text("1. Upload Source (Texture)", width/4, height/2);
  text("2. Upload Target (Canvas)", width*0.75, height/2);
  
  // Create Input for Source (The Paint)
  let inputSource = createFileInput(handleSource);
  inputSource.position(width/4 - 70, height/2 + 30);
  
  // Create Input for Target (The Canvas)
  let inputTarget = createFileInput(handleTarget);
  inputTarget.position(width*0.75 - 70, height/2 + 30);
}

function handleSource(file) {
  if (file.type === 'image') {
    // Load full resolution
    sourceImg = loadImage(file.data, () => {
      console.log(`Source Loaded: ${sourceImg.width}x${sourceImg.height}`);
      // Don't resize source! Keep the texture crisp.
      processSourceTiles(); 
    });
  }
}

function handleTarget(file) {
  if (file.type === 'image') {
    targetImg = loadImage(file.data, () => {
      console.log(`Target Loaded: ${targetImg.width}x${targetImg.height}`);
      // Resize the canvas to match the massive target image exactly
      targetImg.resize(targetImg.width*scaleFactor, targetImg.height*scaleFactor);
      resizeCanvas(targetImg.width, targetImg.height);
      drawMosaic();
    });
  }
}

function processSourceTiles() {
  if (!sourceImg) return;
  
  tiles = []; // Clear old tiles
  
  // We loop through the source image to extract tiles
  // If source is smaller than target, that's fine, we just reuse the tiles.
  
  let w = sourceImg.width;
  let h = sourceImg.height;
  
  sourceImg.loadPixels();
  
  for (let y = 0; y <= h - tileSize; y += tileSize) {
    for (let x = 0; x <= w - tileSize; x += tileSize) {
      
      // Extract the tile
      let tile = sourceImg.get(x, y, tileSize, tileSize);
      
      // Calculate Brightness
      // Optimization: We analyze the tile's own pixels
      tile.loadPixels();
      let sumBrightness = 0;
      let count = 0;
      
      // Sampling every 4th pixel is enough for an average and much faster
      for (let i = 0; i < tile.pixels.length; i += 4 * 4) {
        let r = tile.pixels[i];
        let g = tile.pixels[i+1];
        let b = tile.pixels[i+2];
        // Luminance formula
        sumBrightness += (0.299*r + 0.587*g + 0.114*b);
        count++;
      }
      
      let avg = sumBrightness / count;
      
      tiles.push({
        img: tile,
        b: avg
      });
    }
  }
  
  // Sort tiles by brightness (Darkest -> Lightest)
  tiles.sort((a, b) => a.b - b.b);
  
  console.log(`Dictionary Created: ${tiles.length} tiles processed.`);
  
  // Visual feedback
  background(50, 200, 50);
  fill(0);
  text("Source Ready! Upload Target.", width/2, height/2);
}

function drawMosaic() {
  if (!targetImg || tiles.length === 0) return;
  
  // Prepare pixel access for the target
  targetImg.loadPixels();
  
  let cols = floor(targetImg.width / tileSize);
  let rows = floor(targetImg.height / tileSize);
  
  // Loop through the grid
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      
      // Calculate exact pixel coordinates
      let px = x * tileSize;
      let py = y * tileSize;
      
      // To get the brightness of the target area, we can just sample the center pixel
      // or average the area. Sampling the center is instantaneous.
      let centerIdx = 4 * ((py + tileSize/2) * targetImg.width + (px + tileSize/2));
      
      // Safety check for array bounds
      if (centerIdx < targetImg.pixels.length - 4) {
        let r = targetImg.pixels[centerIdx];
        let g = targetImg.pixels[centerIdx+1];
        let b = targetImg.pixels[centerIdx+2];
        
        // Calculate brightness of the target spot
        let targetBright = (0.299*r + 0.587*g + 0.114*b);
        
        // Map this brightness to our sorted tile array
        // 0 brightness -> Index 0
        // 255 brightness -> Index (length-1)
        let mapIdx = floor(map(targetBright, 0, 255, 0, tiles.length - 1));
        mapIdx = constrain(mapIdx, 0, tiles.length - 1);
        
        // Draw the tile
        image(tiles[mapIdx].img, px, py, tileSize, tileSize);
      }
    }
  }
  
  console.log("Rendering Complete");
}

function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('selfRefMosaic_' + timeStamp);
    }
}