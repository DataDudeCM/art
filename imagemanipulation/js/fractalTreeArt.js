let doodle;
let levels = 6;

function preload() {
  // Replace with your uploaded doodle filename
  doodle = loadImage('../images/spacecity.jpg'); 
}

function setup() {
  createCanvas(800, 800);
  noLoop();
  background(255);
  // Start the recursive subdivision
  subdivide(0, 0, width, height, levels);
}

function subdivide(x, y, w, h, level) {
  // Early exit chance (10%) to vary the visual density
  if (level > 0 && random(1) < 0.1) {
    seedInkDoodle(x, y, w, h);
    return;
  }
  
  // Base case: deepest level
  if (level === 0) {
    seedInkDoodle(x, y, w, h);
    return;
  }
  
  // Logic adapted from your recursiveRect.js
  let orientation = random(['vertical', 'horizontal']);
  let numParts = random([2, 3]);
  
  if (orientation === 'vertical') {
    let partWidth = w / numParts;
    for (let i = 0; i < numParts; i++) {
      subdivide(x + i * partWidth, y, partWidth, h, level - 1);
    }
  } else {
    let partHeight = h / numParts;
    for (let i = 0; i < numParts; i++) {
      subdivide(x, y + i * partHeight, w, partHeight, level - 1);
    }
  }
}

/**
 * Custom effect: Samples a random portion of your doodle 
 * and fits it into the current recursive rectangle.
 */
function seedInkDoodle(x, y, w, h) {
  // Pick a random source point from your doodle
  let sx = random(doodle.width - w);
  let sy = random(doodle.height - h);
  
  // Sample the "Seed"
  let imgPart = doodle.get(sx, sy, w, h);
  
  push();
  // Occasional rotation adds complexity similar to your spagSlice rotation logic
  if(random(1) > 0.5) {
    translate(x + w/2, y + h/2);
    rotate(HALF_PI * floor(random(4)));
    image(imgPart, -w/2, -h/2, w, h);
  } else {
    image(imgPart, x, y, w, h);
  }
  
  // Optional: Draw a thin border to emphasize the "Recursive" structure
  noFill();
  stroke(0, 50); // Faint black border
  rect(x, y, w, h);
  pop();
}