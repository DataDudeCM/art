// Only include the fill and circle effects now
let effects = [effectFill];

function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight(6); // Set line thickness to 4 pixels
  noLoop(); // Render once
  background(255); // White background
  subdivide(0, 0, width, height, 4); // Start with 4 levels deep
}

/**
 * Recursively subdivides a rectangle.
 * At each level, it randomly chooses orientation (vertical/horizontal)
 * and splits into either 2 or 3 equal parts. Additionally, there's a chance
 * to end the recursion early and apply a random effect, resulting in varying depths.
 */
function subdivide(x, y, w, h, level) {
  // With a 30% chance, stop subdividing early (if we're not at the deepest level)
  if (level > 0 && random(1) < 0.1) {
    applyRandomEffect(x, y, w, h);
    return;
  }
  
  // Base case: if we've reached the deepest level, apply an effect.
  if (level === 0) {
    applyRandomEffect(x, y, w, h);
    return;
  }
  
  // Randomly choose between vertical or horizontal split
  let orientation = random(['vertical', 'horizontal']);
  // Randomly choose to split into 2 or 3 equal parts
  let numParts = random([2, 3]);
  
  if (orientation === 'vertical') {
    let partWidth = w / numParts;
    for (let i = 0; i < numParts; i++) {
      let nx = x + i * partWidth;
      subdivide(nx, y, partWidth, h, level - 1);
    }
  } else { // horizontal split
    let partHeight = h / numParts;
    for (let i = 0; i < numParts; i++) {
      let ny = y + i * partHeight;
      subdivide(x, ny, w, partHeight, level - 1);
    }
  }
}

/**
 * At a leaf (or early termination), randomly decide whether to apply an effect
 * or just draw a rectangle border.
 */
function applyRandomEffect(x, y, w, h) {
  if (random(1) < 0.75) {
    let effect = random(effects); // Choose an effect at random
    effect(x, y, w, h);
  } else {
    noFill();
    stroke(0);
    rect(x, y, w, h);
  }
}

/**
 * Effect: Fill the rectangle with a random color chosen from red, yellow, blue, or white.
 */
function effectFill(x, y, w, h) {
  let fillColors = ['red', 'yellow', 'blue', 'white'];
  fill(random(fillColors));
  stroke(0);
  rect(x, y, w, h);
}

/**
 * Effect: Draw the rectangle and add a circle in its center.
 */
function effectCircles(x, y, w, h) {
  noFill();
  stroke(0);
  rect(x, y, w, h);
  stroke('blue');
  let diameter = min(w, h) / 2; // Circle diameter is half the smallest side
  ellipse(x + w / 2, y + h / 2, diameter, diameter);
}
