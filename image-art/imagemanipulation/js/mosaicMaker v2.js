// Mosaic Maker - p5.js Version
// A high-fidelity brightness mosaic generator.
// Key Features:
// - Fast tile analysis using sampling
// - Brightness-based lookup for instant tile retrieval
// - Off-screen buffer for smooth rendering
// - 'F' key toggle to compare original and mosaic
// - Responsive UI with status updates  
let sourceImg = null;
let targetImg = null;

// Lookup Table (LUT)
let brightnessLUT = new Array(256);

// Buffers and State
let mosaicBuffer; // Holds the generated mosaic in memory
let showOriginal = false; // Toggle state for 'f' key

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

  // --- Source Image Controls ---
  sourceFileInput = createFileInput(handleSourceFile);
  sourceFileInput.parent('source-file-input-container');

  tileSizeSlider = createSlider(5, 200, 20, 5);
  tileSizeSlider.parent('tile-size-slider-container');
  tileSizeSlider.style('width', '100%');
  
  tileSizeSlider.changed(() => {
      if (sourceImg) processSourceImage();
  });
  tileSizeSlider.input(() => {
      tileSizeValDisplay.html(tileSizeSlider.value());
  });

  // --- Target Image Controls ---
  targetFileInput = createFileInput(handleTargetFile);
  targetFileInput.parent('target-file-input-container');
  if (key == 's' || key == 'S') {
  // images go to Downloads folder
  let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
    save('mosaicMaker_' + timeStamp);
  }
  scaleSlider = createSlider(0.1, 10, 1.0, 0.1);
  scaleSlider.parent('scale-slider-container');
  scaleSlider.style('width', '100%');
  
  scaleSlider.changed(() => {
      triggerUpdate();
  });
  scaleSlider.input(() => {
      scaleValDisplay.html(scaleSlider.value());
  });
}

// --- NEW: Key Press Handler ---
function keyPressed() {
  // Check for 'f' or 'F'
  if (key === 'f' || key === 'F') {
    if (mosaicBuffer && targetImg) {
      showOriginal = !showOriginal;
      redrawOutput(); // Switch the view
    }
  }

}

// --- File Handling ---

function handleSourceFile(file) {
  if (file.type === 'image') {
    sourceStatus.html('Loading...');
    loadImage(file.data, (img) => {
      sourceImg = img;
      sourceStatus.html('Processing...');
      sourceThumb.elt.src = file.data;
      sourceThumb.removeClass('hidden');
      sourceDimsDisplay.html(`${sourceImg.width} x ${sourceImg.height} px`);
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
      targetDimsDisplay.html(`${targetImg.width} x ${targetImg.height} px`);
      triggerUpdate();
    });
  } else {
    targetStatus.html('Not an image.');
  }
}

// --- Process Source Tiles ---

function processSourceImage() {
  if (!sourceImg) return;
  
  mainStatus.html("Analyzing source tiles...");
  
  setTimeout(() => {
    if (sourceImg.width > 1200) {
        sourceImg.resize(1200, 0);
        sourceDimsDisplay.html(`${sourceImg.width} x ${sourceImg.height} px (Resized)`);
    }

    let tileSize = tileSizeSlider.value();
    let buckets = Array.from({ length: 256 }, () => []);

    let w = sourceImg.width;
    let h = sourceImg.height;
    let cols = floor(w / tileSize);
    let rows = floor(h / tileSize);

    let totalTiles = cols * rows;
    sourceTileCountDisplay.html(totalTiles);

    sourceImg.loadPixels();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let tile = sourceImg.get(x * tileSize, y * tileSize, tileSize, tileSize);
        
        tile.loadPixels();
        let r=0, g=0, b=0, count=0;
        for(let i=0; i < tile.pixels.length; i+=16) { 
           r += tile.pixels[i];
           g += tile.pixels[i+1];
           b += tile.pixels[i+2];
           count++;
        }
        let avg = floor((r+g+b)/(count*3));
        buckets[avg].push(tile);
      }
    }

    for (let i = 0; i < 256; i++) {
        if (buckets[i].length > 0) {
            brightnessLUT[i] = random(buckets[i]);
        } else {
            let nearest = findNearestBucket(buckets, i);
            brightnessLUT[i] = nearest ? random(nearest) : null;
        }
    }

    mainStatus.html(`Source Ready.`);
    triggerUpdate();
  }, 50);
}

function findNearestBucket(buckets, targetIndex) {
    let offset = 1;
    while(offset < 256) {
        let lower = targetIndex - offset;
        let upper = targetIndex + offset;
        if (lower >= 0 && buckets[lower].length > 0) return buckets[lower];
        if (upper < 256 && buckets[upper].length > 0) return buckets[upper];
        offset++;
    }
    return null;
}


// --- Generate Mosaic ---

function triggerUpdate() {
    if (sourceImg && targetImg && !isProcessing) {
        mainStatus.html("Rendering...");
        isProcessing = true;
        
        // Reset view to mosaic when generating new one
        showOriginal = false; 

        setTimeout(() => {
            generateMosaic();
            isProcessing = false;
            // Update status with instruction
            mainStatus.html("Done. Press 'F' to compare.");
        }, 10);
    }
}

function generateMosaic() {
  let scaleFactor = scaleSlider.value();
  let tileSize = tileSizeSlider.value();

  let finalW = floor(targetImg.width * scaleFactor);
  let finalH = floor(targetImg.height * scaleFactor);
  
  // Resize main canvas
  resizeCanvas(finalW, finalH);

  // Initialize the off-screen buffer
  if (mosaicBuffer) mosaicBuffer.remove(); // Clear old memory
  mosaicBuffer = createGraphics(finalW, finalH);
  
  let cols = ceil(finalW / tileSize);
  let rows = ceil(finalH / tileSize);
  
  // Create tiny reference image for color picking
  let ref = targetImg.get();
  ref.resize(cols, rows);
  ref.loadPixels();

  // Draw onto the BUFFER, not the canvas directly
  mosaicBuffer.background(0);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      
      let index = (x + y * cols) * 4;
      let r = ref.pixels[index];
      let g = ref.pixels[index + 1];
      let b = ref.pixels[index + 2];
      let bright = floor((r + g + b) / 3);

      let tile = brightnessLUT[bright];

      if (tile) {
        mosaicBuffer.image(tile, x * tileSize, y * tileSize, tileSize, tileSize);
      } else {
        mosaicBuffer.fill(r,g,b);
        mosaicBuffer.noStroke();
        mosaicBuffer.rect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  // Finally, draw the result to screen
  redrawOutput();
}

// --- NEW: Helper to switch views ---
function redrawOutput() {
  if (showOriginal) {
    // Draw original image scaled to fit canvas
    image(targetImg, 0, 0, width, height);
    mainStatus.html("Showing Original (Press 'F' to switch)");
  } else {
    // Draw the generated mosaic buffer
    if (mosaicBuffer) {
        image(mosaicBuffer, 0, 0);
        mainStatus.html("Showing Mosaic (Press 'F' to switch)");
    }
  }
}