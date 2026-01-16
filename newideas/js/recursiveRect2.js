let gap = 4; // Gap between rectangles (adjust as needed)
let effects = [effectFill, effectCircles]; // List of effect functions to choose from

function setup() {
  createCanvas(800, 800);
  strokeWeight(4); // Set line thickness to 4 pixels
  //noLoop(); // Render once
  frameRate(1);

  
  // Choose an initial orientation randomly
  let initialOrientation = random(['vertical', 'horizontal']);
  subdivide(0, 0, width, height, 4, initialOrientation);
}

function draw() {
  background(255); // White background
    // Choose an initial orientation randomly
  let initialOrientation = random(['vertical', 'horizontal']);
  subdivide(0, 0, width, height, 4, initialOrientation);
}

/**
 * Recursively subdivides a rectangle.
 * At each level, the segmentation orientation alternates.
 * Additionally, there's a chance (30%) to stop subdividing early,
 * resulting in varying depths.
 */
function subdivide(x, y, w, h, level, orientation) {
  // With a 30% chance, stop subdividing early if levels remain
  if (level > 0 && random(1) < 0.1) {
    applyRandomEffect(x, y, w, h);
    return;
  }
  
  // Base case: if we've reached level 0, apply an effect.
  if (level === 0) {
    applyRandomEffect(x, y, w, h);
    return;
  }
  
  // Randomly choose to split into 2 or 3 equal parts
  let numParts = random([2, 3]);
  
  if (orientation === 'vertical') {
    let partWidth = w / numParts;
    let newOrientation = 'horizontal';
    for (let i = 0; i < numParts; i++) {
      let nx = x + i * partWidth;
      subdivide(nx, y, partWidth, h, level - 1, newOrientation);
    }
  } else { // orientation === 'horizontal'
    let partHeight = h / numParts;
    let newOrientation = 'vertical';
    for (let i = 0; i < numParts; i++) {
      let ny = y + i * partHeight;
      subdivide(x, ny, w, partHeight, level - 1, newOrientation);
    }
  }
}

/**
 * At a leaf (or early termination), randomly decide whether to apply an effect
 * or just draw a rectangle border.
 */
function applyRandomEffect(x, y, w, h) {
  if (random(1) < 0.5) {
    let effect = random(effects); // Choose an effect at random
    effect(x, y, w, h);
  } else {
    noFill();
    stroke(0);
    // Draw the rectangle inset by the gap on all sides
    rect(x + gap, y + gap, w - 2 * gap, h - 2 * gap);
  }
}

/**
 * Effect: Fill the rectangle with a random color chosen from red, yellow, blue, or white.
 */
function effectFill(x, y, w, h) {
  let fillColors = ['red', 'yellow', 'blue', 'white'];
  fill(random(fillColors));
  stroke(0);
  rect(x + gap, y + gap, w - 2 * gap, h - 2 * gap);
}

/**
 * Effect: Draw the rectangle and add a circle in its center.
 */
function effectCircles(x, y, w, h) {
  noFill();
  stroke(0);
  rect(x + gap, y + gap, w - 2 * gap, h - 2 * gap);
  //stroke('blue');
  let effectiveW = w - 2 * gap;
  let effectiveH = h - 2 * gap;
  let diameter = min(effectiveW, effectiveH) / 2;
  // Center the circle in the inset rectangle
  fill('Black');
  ellipse(x + gap + effectiveW / 2, y + gap + effectiveH / 2, diameter, diameter);
}
