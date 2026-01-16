/*
  Audio-Driven Watercolor Painting in p5.js

  Instead of painting with the mouse, this sketch creates watercolor strokes
  based on an MP3 file. The strokes are generated automatically whenever the song's
  amplitude (volume) exceeds a threshold. The size and transparency of each stroke
  are modulated by the song's intensity, and each stroke gets added texture and, on occasion,
  a subtle inner splotch.
*/

let song;
let amplitude;
let lastStrokeTime = 0;
let strokeInterval = 300; // Minimum time (in ms) between strokes

let watercolorLayer;
let textureLayer;

function preload() {
  // Replace 'your-song.mp3' with the path to your MP3 file.
  song = loadSound('../common/testmusic.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Create an amplitude analyzer
  amplitude = new p5.Amplitude();
  
  // Create an off-screen graphics buffer for the watercolor strokes.
  watercolorLayer = createGraphics(width, height);
  watercolorLayer.clear();
  
  // Create a paper texture overlay.
  textureLayer = createGraphics(width, height);
  textureLayer.clear();
  textureLayer.noStroke();
  
  // Generate a subtle paper texture using tiny translucent dots.
  let numDots = width * height / 150;
  for (let i = 0; i < numDots; i++) {
    let x = random(width);
    let y = random(height);
    let dotSize = random(0.5, 2);
    textureLayer.fill(0, random(5, 20));
    textureLayer.ellipse(x, y, dotSize, dotSize);
  }
  
  background(255); // White background resembling watercolor paper
}

function draw() {
  background(255);
  
  // Draw the watercolor strokes.
  image(watercolorLayer, 0, 0);
  
  // Overlay the paper texture.
  tint(255, 80);
  image(textureLayer, 0, 0);
  noTint();
  
  // Get the current amplitude level from the song.
  let level = amplitude.getLevel();
  let threshold = 0.05; // Only trigger strokes when the amplitude exceeds this
  
  // If the level is high enough and enough time has passed since the last stroke, paint a new stroke.
  if (level > threshold && millis() - lastStrokeTime > strokeInterval) {
    // Choose a random position for the stroke.
    let x = random(width);
    let y = random(height);
    drawWatercolorStroke(x, y, level);
    lastStrokeTime = millis();
  }
}

// Use a mouse press as a user gesture to start the song (auto-play is often blocked by browsers)
function mousePressed() {
  if (!song.isPlaying()) {
    song.play();
  }
}

// Draws a watercolor stroke at (x, y) with properties influenced by the song's amplitude.
function drawWatercolorStroke(x, y, level) {
  // Map the amplitude level to a factor for the stroke's size.
  // (Levels are usually low; adjust the mapping as needed.)
  let factor = map(level, 0, 0.3, 0.5, 2, true);
  let baseRadius = random(40, 120) * factor;
  
  // Define a watercolor color with transparency modulated by the amplitude.
  let strokeAlpha = random(30, 80) + map(level, 0, 1, 0, 50);
  let strokeColor = color(
    random(50, 200),
    random(50, 200),
    random(100, 255),
    strokeAlpha
  );
  
  // Store vertices to optionally use for additional texture.
  let vertices = [];
  let noiseOffset = random(1000);
  
  watercolorLayer.noStroke();
  watercolorLayer.fill(strokeColor);
  watercolorLayer.beginShape();
  
  // Vary the number of vertices per stroke for extra natural variation.
  let numPoints = int(random(80, 120));
  for (let i = 0; i < numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    let noiseFactor = noise(
      cos(angle) * 0.5 + noiseOffset,
      sin(angle) * 0.5 + noiseOffset,
      i * 0.05
    );
    // Adjust the radius using noise and a small random offset.
    let r = baseRadius + map(noiseFactor, 0, 1, -20, 20) + random(-5, 5);
    let vx = x + r * cos(angle);
    let vy = y + r * sin(angle);
    vertices.push({ x: vx, y: vy });
    watercolorLayer.curveVertex(vx, vy);
  }
  watercolorLayer.endShape(CLOSE);
  
  // Add extra texture details within the stroke.
  addStrokeTexture(x, y, baseRadius);
  
  // Randomly add an inner splotch (50% chance) for additional visual interest.
  if (random(1) < 0.5) {
    addRandomSplotch(x, y, baseRadius, strokeColor);
  }
  
  // Apply a light blur to simulate watercolor diffusion.
  watercolorLayer.filter(BLUR, 0.5);
}

// Adds fine, random texture within the stroke.
function addStrokeTexture(x, y, baseRadius) {
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

// Adds a smaller, more transparent inner splotch to enhance the watercolor effect.
function addRandomSplotch(x, y, baseRadius, strokeColor) {
  let offsetAngle = random(TWO_PI);
  let offsetDistance = random(baseRadius * 0.2, baseRadius * 0.5);
  let splotchX = x + offsetDistance * cos(offsetAngle);
  let splotchY = y + offsetDistance * sin(offsetAngle);
  
  let splotchRadius = random(10, baseRadius * 0.3);
  let noiseOffset = random(1000);
  
  // Make a more transparent version of the stroke color.
  let splotchColor = color(
    red(strokeColor),
    green(strokeColor),
    blue(strokeColor),
    alpha(strokeColor) * 0.5
  );
  
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
