let font;
let originalPoints = [];
let textString = "CHAOS";
let chaos = 0; // Chaos factor oscillates over time for dynamic effect

function preload() {
  // Replace with the path to your font file
  font = loadFont('../common/fonts/test_sans.ttf');
}

function setup() {
  createCanvas(800, 600);
  textFont(font);
  textSize(150);
  // Convert the text into a series of points.
  // Adjust the x and y offsets as needed to center your text.
  let pts = font.textToPoints(textString, 100, 200, 150, {
    sampleFactor: 1
  });
  // Save original points for reference.
  for (let p of pts) {
    originalPoints.push(createVector(p.x, p.y));
  }
}

function draw() {
  background(255,20);
  
  // Chaos factor oscillates over time using a sine wave.
  chaos = map(sin(frameCount * 0.01), -1, 1, 0, 1);
  
  stroke(0);
  strokeWeight(4);
  noFill();
  
  // Begin drawing the connected segments.
  beginShape();
  let prev = null;
  // Loop through all the points.
  for (let i = 0; i < originalPoints.length; i++) {
    let orig = originalPoints[i];
    
    // Compute displacement using Perlin noise.
    let nX = noise(orig.x * 0.01, orig.y * 0.01, frameCount * 0.02);
    let nY = noise(orig.y * 0.01, orig.x * 0.01, frameCount * 0.02 + 100);
    let angle = map(nX, 0, 1, 0, TWO_PI);
    let amplitude = map(nY, 0, 1, 0, 25 * chaos);
    let offset = p5.Vector.fromAngle(angle).mult(amplitude);
    
    // The current position after displacement.
    let currentPos = p5.Vector.add(orig, offset);
    
    // Check distance from the previous point.
    // If too far apart, we end the current shape and start a new one.
    if (prev && p5.Vector.dist(prev, currentPos) > 20) {
      endShape();
      beginShape();
    }
    
    vertex(currentPos.x, currentPos.y);
    prev = currentPos;
  }
  endShape();
}
