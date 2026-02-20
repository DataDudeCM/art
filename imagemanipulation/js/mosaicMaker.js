// Mosaic Maker with Quadtree Subdivision
// A high-fidelity RGB mosaic generator using a quadtree approach.
// Key Features:      
// - Quadtree subdivision based on local variance for detail preservation 
// - RGB matching for more accurate tile selection
// - Off-screen buffer for smooth rendering
// - 'F' key toggle to compare original and mosaic
// - Responsive UI with status updates

let sourceImg = null;
let targetImg = null;

// Source tiles array
let sourceTiles = [];

// Buffers
let mosaicBuffer; 
let showOriginal = false;
let bordersEnabled = false; // Set to true to draw borders around tiles

// DOM & Controls
let sourceFileInput, targetFileInput;
let minSizeSlider, scaleSlider, thresholdSlider; // Added thresholdSlider
let sourceStatus, targetStatus, mainStatus;
let sourceThumb, targetThumb;
let tileSizeValDisplay, scaleValDisplay, thresholdValDisplay; // Added display
let sourceDimsDisplay, sourceTileCountDisplay, targetDimsDisplay;

let isProcessing = false;
let gap = -1; // Negative gap creates overlap to hide seams

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
  // Grab standard DOM elements
  sourceStatus = select('#source-status-text');
  targetStatus = select('#target-status-text');
  mainStatus = select('#main-status');
  sourceThumb = select('#source-thumbnail');
  targetThumb = select('#target-thumbnail');
  tileSizeValDisplay = select('#tile-size-val');
  scaleValDisplay = select('#scale-val');
  
  // We need to create a text display for our new Threshold slider
  // We'll insert it into the stats box or append it dynamically
  
  sourceDimsDisplay = select('#source-dims');
  sourceTileCountDisplay = select('#source-tile-count');
  targetDimsDisplay = select('#target-dims');

  select('#btn-visualize').mousePressed(saveProcessVisualization); // New button to save process steps

  // --- Source Input ---
  sourceFileInput = createFileInput(handleSourceFile);
  sourceFileInput.parent('source-file-input-container');

  // Slider 1: Now acts as "Minimum Tile Size"
  minSizeSlider = createSlider(4, 200, 10, 2); 
  minSizeSlider.parent('tile-size-slider-container');
  minSizeSlider.style('width', '100%');
  minSizeSlider.changed(() => { triggerUpdate(); }); // Changing min size affects the Target generation now
  minSizeSlider.input(() => { tileSizeValDisplay.html("Min: " + minSizeSlider.value()); });

  // --- Target Input ---
  targetFileInput = createFileInput(handleTargetFile);
  targetFileInput.parent('target-file-input-container');

  scaleSlider = createSlider(0.1, 8, 1.0, 0.1);
  scaleSlider.parent('scale-slider-container');
  scaleSlider.style('width', '100%');
  scaleSlider.changed(() => { triggerUpdate(); });
  scaleSlider.input(() => { scaleValDisplay.html(scaleSlider.value()); });

  // --- NEW: Threshold Slider ---
  // We create a new container div dynamically for it
  let controlPanel = select('#controls-panel');
  
  let thresholdContainer = createDiv();
  thresholdContainer.class('slider-container');
  thresholdContainer.parent(controlPanel); // Append to bottom of controls

  let label = createElement('label', 'Detail Threshold: <span id="thresh-val">40</span>');
  label.parent(thresholdContainer);
  thresholdValDisplay = select('#thresh-val');

  thresholdSlider = createSlider(0, 150, 40, 1);
  thresholdSlider.parent(thresholdContainer);
  thresholdSlider.style('width', '100%');
  
  // Lower threshold = More splits (High detail). Higher = Blocky.
  thresholdSlider.changed(() => { triggerUpdate(); });
  thresholdSlider.input(() => { thresholdValDisplay.html(thresholdSlider.value()); });
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
  if (key == 'b' || key == 'B') {
    bordersEnabled = !bordersEnabled;
    triggerUpdate();
  }
}

// --- FILE HANDLING ---
// (Same as before, simplified slightly)

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
  }
}


// --- STEP 1: PREPARE SOURCE TILES ---

function processSourceImage() {
  if (!sourceImg) return;
  mainStatus.html("Analyzing source...");
  
  setTimeout(() => {
    // 1. Resize huge source images
    if (sourceImg.width > 1200) sourceImg.resize(1200, 0);

    // FIXED SOURCE SIZE: 
    // For Quadtree, we want high-quality source tiles that can be scaled down.
    // We'll cut the source into fixed 50x50 blocks.
    let extractSize = 50; 
    
    sourceTiles = []; 
    let w = sourceImg.width;
    let h = sourceImg.height;
    let cols = floor(w / extractSize);
    let rows = floor(h / extractSize);

    if(sourceTileCountDisplay) sourceTileCountDisplay.html(cols * rows);

    sourceImg.loadPixels();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let tile = sourceImg.get(x * extractSize, y * extractSize, extractSize, extractSize);
        
        // Calculate Average RGB
        tile.loadPixels();
        let r=0, g=0, b=0, count=0;
        for(let i=0; i < tile.pixels.length; i+=100) { // Sample sparsely for speed
           r += tile.pixels[i];
           g += tile.pixels[i+1];
           b += tile.pixels[i+2];
           count++;
        }
        sourceTiles.push({
            img: tile,
            r: (count > 0) ? floor(r/count) : 0,
            g: (count > 0) ? floor(g/count) : 0,
            b: (count > 0) ? floor(b/count) : 0
        });
      }
    }
    mainStatus.html(`Source Ready: ${sourceTiles.length} large tiles.`);
    triggerUpdate();
  }, 50);
}


// --- STEP 2: QUADTREE GENERATION ---

function triggerUpdate() {
    if (sourceImg && targetImg && !isProcessing) {
        mainStatus.html("Computing Quadtree...");
        isProcessing = true;
        showOriginal = false; 

        setTimeout(() => {
            generateQuadtreeMosaic();
            isProcessing = false;
            mainStatus.html("Done. Press 'F' to compare.");
        }, 50);
    }
}

function generateQuadtreeMosaic() {
  let scaleFactor = scaleSlider.value();
  let minSize = minSizeSlider.value();
  let threshold = thresholdSlider.value();

  // 1. Resize target internally for calculations
  let finalW = floor(targetImg.width * scaleFactor);
  let finalH = floor(targetImg.height * scaleFactor);
  
  resizeCanvas(finalW, finalH);
  if (mosaicBuffer) mosaicBuffer.remove();
  mosaicBuffer = createGraphics(finalW, finalH);
  mosaicBuffer.noStroke(); // Pixelated look
  
  // 2. We need a resized version of target image to read pixels from easily
  // We use this "reference" image for all color/variance checks
  let refImg = targetImg.get();
  refImg.resize(finalW, finalH);
  refImg.loadPixels();

  mosaicBuffer.background(0); // Start with black background to highlight gaps

  // 3. Start Recursive Division
  // We start with one giant block covering the whole image
  subdivide(0, 0, finalW, finalH, refImg, minSize, threshold);

  redrawOutput();
}

// THE RECURSIVE FUNCTION
function subdivide(x, y, w, h, refImg, minSize, threshold) {
    
    // Base Case 1: If the block is small enough (hit the limit), STOP and draw.
    // This creates your uniform grid size.
    if (w <= minSize || h <= minSize) {
        drawBestTile(x, y, w, h, refImg);
        return;
    }

    // Check Variance (How detailed is this area?)
    let variance = getVariance(x, y, w, h, refImg);

    // Decision: Split or Draw?
    // FIX: We added "|| threshold === 0"
    // This forces a split even if the area is a solid color (variance 0)
    if (variance > threshold || threshold === 0) {
        
        let halfW = w / 2;
        let halfH = h / 2;
        
        // Recursion (Split into 4)
        subdivide(x, y, halfW, halfH, refImg, minSize, threshold);           
        subdivide(x + halfW, y, halfW, halfH, refImg, minSize, threshold);   
        subdivide(x, y + halfH, halfW, halfH, refImg, minSize, threshold);   
        subdivide(x + halfW, y + halfH, halfW, halfH, refImg, minSize, threshold); 
    } else {
        // Low detail -> Draw one big tile
        drawBestTile(x, y, w, h, refImg);
    }
}

function drawBestTile(x, y, w, h, refImg) {
    // 1. Find the average color
    let avgColor = getAverageColor(x, y, w, h, refImg);
    
    // 2. Find best matching tile from source
    let bestTile = findBestMatch(avgColor.r, avgColor.g, avgColor.b);
    
    // 3. Draw it into buffer
    if (bestTile) {
        // THE FIX: We add +1 to width and height to create a slight overlap
        // causing the tiles to "bleed" over the black gaps.

        mosaicBuffer.image(bestTile.img, x, y, w - gap, h - gap);
    } else {
        mosaicBuffer.fill(avgColor.r, avgColor.g, avgColor.b);
        mosaicBuffer.rect(x, y, w - gap, h - gap); // Add bleed here too
    }
    if (bordersEnabled) {
      mosaicBuffer.noFill();
      mosaicBuffer.strokeWeight(random(0.5, 1.5)); // Randomize stroke weight for a more organic look
      mosaicBuffer.stroke(0);
      mosaicBuffer.rect(x, y, w + 1, h + 1); // Draw a border to prevent gaps
    }
}


// --- HELPERS ---

// Calculates how "busy" a region is. 
// Simplest fast method: Max brightness - Min brightness in the region.
function getVariance(x, y, w, h, img) {
    // Convert float coordinates to integers for pixel access
    let startX = floor(x);
    let startY = floor(y);
    let endX = floor(x + w);
    let endY = floor(y + h);
    
    let minBright = 255;
    let maxBright = 0;
    
    // Optimization: Don't check every pixel. Check a grid of points.
    // We step by 2 or 4 pixels depending on size to keep it fast.
    let step = (w > 20) ? 5 : 2; 

    for (let j = startY; j < endY; j += step) {
        for (let i = startX; i < endX; i += step) {
            // Safety check for bounds
            if (i >= img.width || j >= img.height) continue;

            let idx = (i + j * img.width) * 4;
            let r = img.pixels[idx];
            let g = img.pixels[idx+1];
            let b = img.pixels[idx+2];
            let bright = (r+g+b)/3;
            
            if (bright < minBright) minBright = bright;
            if (bright > maxBright) maxBright = bright;
        }
    }
    return maxBright - minBright;
}

function getAverageColor(x, y, w, h, img) {
    let startX = floor(x);
    let startY = floor(y);
    let endX = floor(x + w);
    let endY = floor(y + h);
    
    let sumR = 0, sumG = 0, sumB = 0;
    let count = 0;
    let step = (w > 50) ? 10 : 2; // Optimization

    for (let j = startY; j < endY; j += step) {
        for (let i = startX; i < endX; i += step) {
            if (i >= img.width || j >= img.height) continue;
            let idx = (i + j * img.width) * 4;
            sumR += img.pixels[idx];
            sumG += img.pixels[idx+1];
            sumB += img.pixels[idx+2];
            count++;
        }
    }
    if (count === 0) return {r:0, g:0, b:0};
    return { r: sumR/count, g: sumG/count, b: sumB/count };
}

// Simple RGB Distance finder
function findBestMatch(tr, tg, tb) {
    let bestDist = Infinity;
    let bestTile = null;
    
    // Random sampling for speed if we have too many tiles
    // Quadtree calls this MANY times, so we must be efficient.
    let limit = (sourceTiles.length > 500) ? 100 : sourceTiles.length;
    
    for (let i = 0; i < limit; i++) {
        // If limiting, pick random candidates
        let tile = (limit < sourceTiles.length) ? random(sourceTiles) : sourceTiles[i];

        let dr = tr - tile.r;
        let dg = tg - tile.g;
        let db = tb - tile.b;
        let dist = dr*dr + dg*dg + db*db;

        if (dist < bestDist) {
            bestDist = dist;
            bestTile = tile;
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
        mainStatus.html("Showing Quadtree Mosaic (Press 'F' to switch)");
    }
  }
}
// --- VISUALIZATION TOOL FOR BLOG ---
function saveProcessVisualization() {
  if (!sourceImg || sourceTiles.length === 0) {
    alert("Please upload and process a source image first!");
    return;
  }

  // 1. Setup the Layout
  // We want the Source Image on top, and the Sorted Palette below.
  let padding = 20;
  let labelHeight = 40;
  
  // Calculate width/height for the visualization canvas
  let visW = sourceImg.width; 
  let visH = sourceImg.height + labelHeight + sourceImg.height + labelHeight + padding;
  
  // If the source image is tiny, make the canvas bigger so we can see details
  if (visW < 800) {
      let scale = 800 / visW;
      visW = 800;
      visH = (sourceImg.height * scale) * 2 + (labelHeight * 2) + padding;
  }

  let pg = createGraphics(visW, visH);
  pg.background(255);
  pg.fill(0);
  pg.noStroke();
  pg.textSize(24);
  pg.textAlign(LEFT, TOP);

  // --- STEP 1: DRAW GRID OVERLAY ---
  pg.text("Step 1: Grid Decomposition", padding, padding);
  
  // Draw the source image scaled to fit width
  let imgH = (sourceImg.height / sourceImg.width) * (visW - padding*2);
  pg.image(sourceImg, padding, labelHeight + padding, visW - padding*2, imgH);

  // Draw the Red Grid Lines
  pg.stroke(255, 0, 0, 150); // Red with transparency
  pg.strokeWeight(2);
  pg.noFill();

  // Calculate grid size relative to this visualization
  // (We need to map the 50px extract size to this scaled drawing)
  let scaleRatio = (visW - padding*2) / sourceImg.width;
  let visTileSize = 50 * scaleRatio; // 50 was our fixed extract size

  let cols = sourceImg.width / 50;
  let rows = sourceImg.height / 50;

  for (let x = 0; x <= cols; x++) {
      let xpos = padding + (x * visTileSize);
      pg.line(xpos, labelHeight + padding, xpos, labelHeight + padding + imgH);
  }
  for (let y = 0; y <= rows; y++) {
      let ypos = labelHeight + padding + (y * visTileSize);
      pg.line(padding, ypos, visW - padding, ypos);
  }

  // --- STEP 2: DRAW SORTED PALETTE ---
  let step2Y = labelHeight + padding + imgH + padding;
  pg.noStroke();
  pg.fill(0);
  pg.text("Step 2: Sorted Tile Palette (Dark to Light)", padding, step2Y);

  // Create a sorted copy of our tiles
  // We sort by brightness (r+g+b) to make it look organized
  let sortedTiles = [...sourceTiles]; // Create a copy
  sortedTiles.sort((a, b) => {
      let brightA = a.r + a.g + a.b;
      let brightB = b.r + b.g + b.b;
      return brightA - brightB;
  });

  // Draw them in a dense grid
  let palX = padding;
  let palY = step2Y + labelHeight;
  let palW = visW - padding * 2;
  
  // Calculate how many tiles we can fit in a row
  let tilesPerRow = ceil(sqrt(sortedTiles.length * (palW / imgH))); 
  let tinySize = palW / tilesPerRow;

  for (let i = 0; i < sortedTiles.length; i++) {
      let tile = sortedTiles[i];
      // Calculate grid position
      let tx = (i % tilesPerRow) * tinySize;
      let ty = floor(i / tilesPerRow) * tinySize;
      
      pg.image(tile.img, palX + tx, palY + ty, tinySize, tinySize);
  }

  // Save the result
  save(pg, 'process_visualization.png');
  pg.remove();
}