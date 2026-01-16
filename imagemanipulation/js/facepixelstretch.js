let img;
let faceapi;

// Use your local image file.
const IMAGE_FILE = '../images/portraitimage.webp';
const MAX_IMAGE_SIZE = 800; // Resize if wider than this.

function preload() {
  img = loadImage(IMAGE_FILE);
}

function setup() {
  if (img.width > MAX_IMAGE_SIZE) {
    const newHeight = img.height * (MAX_IMAGE_SIZE / img.width);
    img.resize(MAX_IMAGE_SIZE, newHeight);
  }

  createCanvas(img.width, img.height);
  pixelDensity(1);

  const faceApiOptions = {
    withLandmarks: true,
  };
  faceapi = ml5.faceApi(faceApiOptions, modelReady);

  background(100);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Finding facial features...', width / 2, height / 2);
}

function modelReady() {
  console.log('FaceAPI Model Ready!');
  faceapi.detect(img, gotDetections);
}

// NEW - gotDetections
function gotDetections(error, results) {
  if (error || results.length === 0) {
    console.error('Detection failed or no faces were found.', error);
    image(img, 0, 0, width, height);
    return;
  }

  console.log('SUCCESS! Faces were found.');
  image(img, 0, 0, width, height);

  results.forEach(detection => {
    console.log('Applying glitch to facial features using a precise mask...');
    const parts = detection.parts;

    // We pass the raw points to the glitch function now
    glitchSort(parts.leftEye);
    glitchSort(parts.rightEye);
    glitchSort(parts.mouth);
  });

  console.log("--- GLITCHING COMPLETE! ---");
}

/**
 * NEW HELPER FUNCTION
 * Calculates a bounding box from an array of points.
 * @param {Array} points - An array of { _x, _y } objects.
 * @returns {Object} - An object with { x, y, width, height }.
 */
function getBoundingBox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p._x < minX) minX = p._x;
    if (p._y < minY) minY = p._y;
    if (p._x > maxX) maxX = p._x;
    if (p._y > maxY) maxY = p._y;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * The corrected pixel-sorting function.
 * @param {Array} partPoints - The array of points outlining a facial feature.
 */
// NEW - glitchSort
/**
 * The pixel-sorting function, now with masking.
 * @param {Array} partPoints - The array of points outlining a facial feature.
 */
function glitchSort(partPoints) {
  const box = getBoundingBox(partPoints);

  // --- MASK CREATION ---
  // Create an off-screen graphics buffer to draw our mask onto.
  let mask = createGraphics(width, height);
  mask.noStroke();
  // We begin drawing the custom shape of the facial feature.
  mask.beginShape();
  for (const p of partPoints) {
    mask.vertex(p._x, p._y);
  }
  mask.endShape(CLOSE);
  // --- END MASK CREATION ---

  const x = Math.round(box.x);
  const y = Math.round(box.y);
  const w = Math.round(box.width);
  const h = Math.round(box.height);

  console.log(`--- Starting glitchSort for masked part at [x:${x}, y:${y}] ---`);
  
  loadPixels();
  for (let j = 0; j < h; j++) {
    let rowY = y + j;
    let rowPixels = [];
    for (let i = 0; i < w; i++) {
      let rowX = x + i;
      
      // Check the color of the corresponding pixel on our mask.
      // The mask is black by default, and our shape is white (255).
      let maskColor = mask.get(rowX, rowY);
      
      // If the pixel on the mask is not black, it's inside our shape!
      if (maskColor[0] > 0) {
        let d = (rowX + rowY * width) * 4;
        rowPixels.push({ r: pixels[d], g: pixels[d + 1], b: pixels[d + 2] });
      }
    }

    // Only sort if we actually found pixels inside the mask for this row.
    if (rowPixels.length > 0) {
      rowPixels.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));

      // This part is a little different: we need a counter for our sorted pixels.
      let sortedPixelIndex = 0;
      for (let i = 0; i < w; i++) {
        let rowX = x + i;
        let maskColor = mask.get(rowX, rowY);
        
        // If this spot is inside the mask, place the next sorted pixel here.
        if (maskColor[0] > 0) {
          let d = (rowX + rowY * width) * 4;
          pixels[d] = rowPixels[sortedPixelIndex].r;
          pixels[d + 1] = rowPixels[sortedPixelIndex].g;
          pixels[d + 2] = rowPixels[sortedPixelIndex].b;
          sortedPixelIndex++;
        }
      }
    }
  }
  updatePixels();
}