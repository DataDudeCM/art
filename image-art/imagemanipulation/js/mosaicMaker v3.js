// Mosaic Maker - p5.js Version
// A high-fidelity brightness mosaic generator.
// Key Features:
// - Fast tile analysis using sampling
// - Brightness-based lookup for instant tile retrieval
// - Off-screen buffer for smooth rendering
// - 'F' key toggle to compare original and mosaic
// - Responsive UI with status updates  
// holy grail version with RGB matching instead of brightness only
let sourceImg = null;
let targetImg = null;

// Instead of brightness buckets, we store a flat list of tile objects
// Each object: { img: p5.Image, r: Number, g: Number, b: Number }
let sourceTiles = [];

// Buffers for "Press F" feature
let mosaicBuffer; 
let showOriginal = false;

let sourceFileInput, targetFileInput;
let tileSizeSlider, scaleSlider;

// DOM elements
let sourceStatus, targetStatus, mainStatus;
let sourceThumb, targetThumb;
let tileSizeValDisplay, scaleValDisplay;
let sourceDimsDisplay, sourceTileCountDisplay, targetDimsDisplay;

let isProcessing = false;

function setup() {
  let cnv = createCanvas(400, 400);
  cnv.parent('canvas-container');
  background(220);
  textAlign(CENTER, CENTER);
  text("Upload images to begin", width / 2, height / 2);
  noLoop(); 

  setupInterface();
}

function setupInterface() {
  // Grab all HTML elements
  sourceStatus = select('#source-status-text');
  targetStatus = select('#target-status-text');
  mainStatus = select('#main-status');
  sourceThumb = select('#source-thumbnail');
  targetThumb = select('#target-thumbnail');
  tileSizeValDisplay = select('#tile-size-val');
  scaleValDisplay = select('#scale-val');
  sourceDimsDisplay = select('#source-dims');
  sourceTileCountDisplay = select('#source-tile-count');
  targetDimsDisplay = select('#target-dims');

  // --- Source Input ---
  sourceFileInput = createFileInput(handleSourceFile);
  sourceFileInput.parent('source-file-input-container');

  tileSizeSlider = createSlider(5, 200, 20, 2);
  tileSizeSlider.parent('tile-size-slider-container');
  tileSizeSlider.style('width', '100%');
  tileSizeSlider.changed(() => { if (sourceImg) processSourceImage(); });
  tileSizeSlider.input(() => { tileSizeValDisplay.html(tileSizeSlider.value()); });

  // --- Target Input ---
  targetFileInput = createFileInput(handleTargetFile);
  targetFileInput.parent('target-file-input-container');

  scaleSlider = createSlider(0.1, 8, 1.0, 0.1);
  scaleSlider.parent('scale-slider-container');
  scaleSlider.style('width', '100%');
  scaleSlider.changed(() => { triggerUpdate(); });
  scaleSlider.input(() => { scaleValDisplay.html(scaleSlider.value()); });
  
  // Create Save Button if it doesn't exist (assuming you did this in HTML, but here is JS fallback)
  // let saveBtn = createButton('Save Mosaic');
  // saveBtn.parent('controls-panel');
  // saveBtn.mousePressed(() => saveCanvas('mosaic', 'jpg'));
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    if (mosaicBuffer && targetImg) {
      showOriginal = !showOriginal;
      redrawOutput();
    }
  }
  if (key == 's' || key == 'S') {
  // images go to Downloads folder
  let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
    save('mosaicMaker_' + timeStamp);
  }
}

// --- FILE HANDLING ---

function handleSourceFile(file) {
  if (file.type === 'image') {
    sourceStatus.html('Loading...');
    loadImage(file.data, (img) => {
      sourceImg = img;
      sourceStatus.html('Processing...');
      sourceThumb.elt.src = file.data;
      sourceThumb.removeClass('hidden');
      if(sourceDimsDisplay) sourceDimsDisplay.html(`${sourceImg.width} x ${sourceImg.height} px`);
      processSourceImage();
    });
  } else {
    sourceStatus.html('Not an image.');
  }
}

function handleTargetFile(file) {
  if (file.type === 'image') {
    targetStatus.html('Loading...');
    loadImage(file.data, (img) => {
      targetImg = img;
      targetStatus.html('Ready');
      targetThumb.elt.src = file.data;
      targetThumb.removeClass('hidden');
      if(targetDimsDisplay) targetDimsDisplay.html(`${targetImg.width} x ${targetImg.height} px`);
      triggerUpdate();
    });
  } else {
    targetStatus.html('Not an image.');
  }
}

// --- STEP 1: ANALYZE SOURCE TILES (RGB) ---

function processSourceImage() {
  if (!sourceImg) return;
  mainStatus.html("Analyzing source colors...");
  
  setTimeout(() => {
    // 1. Resize huge source images
    if (sourceImg.width > 1200) {
        sourceImg.resize(1200, 0);
        if(sourceDimsDisplay) sourceDimsDisplay.html(`${sourceImg.width} x ${sourceImg.height} px (Resized)`);
    }

    let tileSize = tileSizeSlider.value();
    sourceTiles = []; // Reset array

    let w = sourceImg.width;
    let h = sourceImg.height;
    let cols = floor(w / tileSize);
    let rows = floor(h / tileSize);

    if(sourceTileCountDisplay) sourceTileCountDisplay.html(cols * rows);

    sourceImg.loadPixels();

    // 2. Cut into tiles and calculate RGB average
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let tile = sourceImg.get(x * tileSize, y * tileSize, tileSize, tileSize);
        
        // Calculate Average RGB
        tile.loadPixels();
        let r=0, g=0, b=0, count=0;
        
        // Sampling every 16th pixel for speed
        for(let i=0; i < tile.pixels.length; i+=16) { 
           r += tile.pixels[i];
           g += tile.pixels[i+1];
           b += tile.pixels[i+2];
           count++;
        }
        
        let avgR = (count > 0) ? floor(r/count) : 0;
        let avgG = (count > 0) ? floor(g/count) : 0;
        let avgB = (count > 0) ? floor(b/count) : 0;

        // Store the tile and its color data
        sourceTiles.push({
            img: tile,
            r: avgR,
            g: avgG,
            b: avgB
        });
      }
    }

    mainStatus.html(`Source Ready: ${sourceTiles.length} tiles.`);
    triggerUpdate();
  }, 50);
}


// --- STEP 2: GENERATE MOSAIC (RGB MATCHING) ---

function triggerUpdate() {
    if (sourceImg && targetImg && !isProcessing) {
        mainStatus.html("Rendering RGB Mosaic...");
        isProcessing = true;
        showOriginal = false; 

        setTimeout(() => {
            generateMosaic();
            isProcessing = false;
            mainStatus.html("Done. Press 'F' to compare.");
        }, 50);
    }
}

function generateMosaic() {
  let scaleFactor = scaleSlider.value();
  let tileSize = tileSizeSlider.value();

  let finalW = floor(targetImg.width * scaleFactor);
  let finalH = floor(targetImg.height * scaleFactor);
  
  resizeCanvas(finalW, finalH);

  if (mosaicBuffer) mosaicBuffer.remove(); 
  mosaicBuffer = createGraphics(finalW, finalH);
  
  let cols = ceil(finalW / tileSize);
  let rows = ceil(finalH / tileSize);
  
  // Create tiny reference image
  let ref = targetImg.get();
  ref.resize(cols, rows);
  ref.loadPixels();

  mosaicBuffer.background(0);

  // DECISION: Full Search vs Fast Search?
  // If we have > 2000 tiles, checking every single one against every target cell 
  // is millions of calculations. We switch to "Fast Mode" if so.
  let fastMode = sourceTiles.length > 2000;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      
      let index = (x + y * cols) * 4;
      let r = ref.pixels[index];
      let g = ref.pixels[index + 1];
      let b = ref.pixels[index + 2];

      // FIND BEST MATCH
      let bestTile = findBestMatch(r, g, b, fastMode);

      if (bestTile) {
        mosaicBuffer.image(bestTile.img, x * tileSize, y * tileSize, tileSize, tileSize);
      } else {
        mosaicBuffer.fill(r,g,b);
        mosaicBuffer.noStroke();
        mosaicBuffer.rect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  redrawOutput();
}

function findBestMatch(tr, tg, tb, fastMode) {
    let bestDist = Infinity;
    let bestTile = null;

    // FAST MODE: Randomly check 500 tiles instead of all of them.
    // ACCURATE MODE: Check every single tile.
    
    let candidates = sourceTiles;
    let limit = sourceTiles.length;
    
    // If fast mode, we only pick 500 random indexes to check
    if (fastMode) {
        limit = 500; 
    }

    for (let i = 0; i < limit; i++) {
        let tile;
        
        if (fastMode) {
            // Pick a random tile from the library
            tile = sourceTiles[floor(random(sourceTiles.length))];
        } else {
            // Iterate through them all
            tile = sourceTiles[i];
        }

        // Euclidean Distance Squared (no need for sqrt for comparison) 

//[Image of 3d distance formula]

        // dist = (r1-r2)^2 + (g1-g2)^2 + (b1-b2)^2
        let dr = tr - tile.r;
        let dg = tg - tile.g;
        let db = tb - tile.b;
        let dist = dr*dr + dg*dg + db*db;

        if (dist < bestDist) {
            bestDist = dist;
            bestTile = tile;
            // Optimization: If it's a "perfect" match, stop searching
            if (bestDist < 10) return bestTile; 
        }
    }
    return bestTile;
}

function redrawOutput() {
  if (showOriginal) {
    image(targetImg, 0, 0, width, height);
    mainStatus.html("Showing Original (Press 'F' to switch)");
  } else {
    if (mosaicBuffer) {
        image(mosaicBuffer, 0, 0);
        mainStatus.html("Showing RGB Mosaic (Press 'F' to switch)");
    }
  }
}