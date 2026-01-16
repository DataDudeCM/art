/*
  Enhanced Interactive Watercolor Painting in p5.js

  Paint with your mouse to create watercolor-like strokes with organic,
  varied edges and extra textural details. When you hold down the right mouse
  button, a darker edge is added to simulate pigment accumulation.
  Additionally, a random, more transparent splotch of watercolor is added within some strokes.
*/

let watercolorLayer;
let textureLayer;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Prevent the browser's context menu on right-click.
  document.oncontextmenu = function() { return false; };

  // Off-screen buffer for watercolor strokes.
  watercolorLayer = createGraphics(width, height);
  watercolorLayer.clear();
  
  // Off-screen buffer for a subtle paper texture.
  textureLayer = createGraphics(width, height);
  textureLayer.clear();
  textureLayer.noStroke();
  
  // Create a paper texture with tiny, translucent dots.
  let numDots = width * height / 150;
  for (let i = 0; i < numDots; i++) {
    let x = random(width);
    let y = random(height);
    let dotSize = random(0.5, 2);
    textureLayer.fill(0, random(5, 20));
    textureLayer.ellipse(x, y, dotSize, dotSize);
  }
  
  background(255); // White watercolor paper
}

function draw() {
  background(255);
  
  // Draw the watercolor strokes.
  image(watercolorLayer, 0, 0);
  
  // Overlay the paper texture.
  tint(255, 80);
  image(textureLayer, 0, 0);
  noTint();
}

function mouseDragged() {
  drawWatercolorStroke(mouseX, mouseY);
}

function drawWatercolorStroke(x, y) {
  // Set the base radius with some variation.
  let baseRadius = random(40, 120);
  
  // Define a translucent watercolor color.
  let strokeColor = color(
    random(50, 200),
    random(50, 200),
    random(100, 255),
    random(30, 80)
  );
  strokeColor = color('Red');
  strokeColor.setAlpha(random(20,60));
  
  // Array to store vertices for the stroke.
  let vertices = [];
  
  // Use a random noise offset for extra variation.
  let noiseOffset = random(1000);
  
  // Draw the main stroke with organic, irregular edges.
  watercolorLayer.noStroke();
  watercolorLayer.fill(strokeColor);
  watercolorLayer.beginShape();
  
  // Vary the number of points per stroke for a natural look.
  let numPoints = int(random(80, 120));
  for (let i = 0; i < numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    let noiseFactor = noise(
      cos(angle) * 0.5 + noiseOffset,
      sin(angle) * 0.5 + noiseOffset,
      i * 0.05
    );
    // Add a small random offset for extra variation.
    let r = baseRadius + map(noiseFactor, 0, 1, -20, 20) + random(-5, 5);
    let vx = x + r * cos(angle);
    let vy = y + r * sin(angle);
    vertices.push({ x: vx, y: vy });
    watercolorLayer.curveVertex(vx, vy);
  }
  watercolorLayer.endShape(CLOSE);
  
  // If holding down the right mouse button, add a darker edge.
  if (mouseButton === RIGHT) {
    let darkEdgeColor = color(
      red(strokeColor) * 0.6,
      green(strokeColor) * 0.6,
      blue(strokeColor) * 0.6,
      alpha(strokeColor) + 20
    );
    
    watercolorLayer.noFill();
    watercolorLayer.stroke(darkEdgeColor);
    watercolorLayer.strokeWeight(random(2, 4)); // Slight variation in edge thickness.
    watercolorLayer.beginShape();
    for (let v of vertices) {
      watercolorLayer.curveVertex(v.x, v.y);
    }
    watercolorLayer.endShape(CLOSE);
  }
  
  // Add extra texture details within the stroke.
  addStrokeTexture(x, y, baseRadius);
  
  // Only add the inner splotch on a random chance (50% probability).
  if (random(1) < 0.5) {
    addRandomSplotch(x, y, baseRadius, strokeColor);
  }
  
  // Apply a light blur to simulate watercolor diffusion (use sparingly).
  watercolorLayer.filter(BLUR, 0.5);
}

function addStrokeTexture(x, y, baseRadius) {
  // Scatter small dots within the stroke for extra texture.
  let numDots = 50;
  watercolorLayer.noStroke();
  for (let i = 0; i < numDots; i++) {
    let angle = random(TWO_PI);
    let distance = random(baseRadius * 0.3, baseRadius);
    let dotX = x + distance * cos(angle);
    let dotY = y + distance * sin(angle);
    let dotSize = random(1, 3);
    let dotColor = color(0, random(10, 30));
    watercolorLayer.fill(dotColor);
    watercolorLayer.ellipse(dotX, dotY, dotSize, dotSize);
  }
}

function addRandomSplotch(x, y, baseRadius, strokeColor) {
  // Generate a random offset for the splotch within the stroke.
  let offsetAngle = random(TWO_PI);
  let offsetDistance = random(baseRadius * 0.2, baseRadius * 0.5);
  let splotchX = x + offsetDistance * cos(offsetAngle);
  let splotchY = y + offsetDistance * sin(offsetAngle);
  
  // Determine a smaller radius for the splotch.
  let splotchRadius = random(10, baseRadius * 0.3);
  
  // Use a new noise offset for variation.
  let noiseOffset = random(1000);
  
  // Create a more transparent version of the stroke color.
  let splotchColor = color(
    red(strokeColor),
    green(strokeColor),
    blue(strokeColor),
    alpha(strokeColor) * 0.5
  );
  
  // Draw the splotch with an irregular edge.
  watercolorLayer.noStroke();
  watercolorLayer.fill(splotchColor);
  watercolorLayer.beginShape();
  let numPoints = int(random(40, 60));
  for (let i = 0; i < numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    let noiseFactor = noise(
      cos(angle) * 0.5 + noiseOffset,
      sin(angle) * 0.5 + noiseOffset,
      i * 0.05
    );
    let r = splotchRadius + map(noiseFactor, 0, 1, -5, 5);
    let vx = splotchX + r * cos(angle);
    let vy = splotchY + r * sin(angle);
    watercolorLayer.curveVertex(vx, vy);
  }
  watercolorLayer.endShape(CLOSE);
}
