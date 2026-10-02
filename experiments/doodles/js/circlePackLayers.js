// Circle Packing with Layered Cutouts
// Each layer has circles "punched out" to reveal the layer below
// The bottom layer shows the background color through all holes
/*
5 Creative Twists for Negative Space
The "Vignette" Fade: Instead of random packing, use a dist() check from the center of the canvas. Make the holes larger and more frequent in the middle, creating a "tunnel" effect that draws the eye into the deep background.

Textured Paper: In your temp graphics buffer, before punching the holes, apply a slight filter(NOISE) or draw thousands of tiny, low-opacity points. This gives the "paper" a tactile, fiber-like texture that catches the digital shadow beautifully.

The "Backlit" Glow: Invert the shadow! Use a bright color (like a neon cyan or orange) for shadowColor and set shadowOffsetX to 0. This makes it look like the layers are being lit from behind, with light leaking through the cutouts.

Inner Shadows (Beveling): To make it look like thick foam-core board, draw the holes twice: once to erase, and once with a slightly offset, dark, low-opacity stroke inside the hole.

Arcane "Paint Strokes": Instead of using ellipse() to punch holes, use a custom shape or a series of quad() calls that look like rough brush strokes. This replicates the "stylized carving" look of the Arcane environments.
*/
let layerCounts = [100, 50, 50]; // Dense bottom, sparse top
let circleData = [[], [], []];
let palette = ['#2b2d42', '#8d99ae', '#edf2f4']; // Darkest to lightest

function setup() {
  createCanvas(800, 800);
  // Generate coordinates for all 3 layers first
  for (let i = 0; i < 3; i++) {
    packLayer(i, layerCounts[i]);
  }
  noLoop();
}

function draw() {
  background('#1a1a1a'); // The "bottom" seen through all holes

  // Draw layers from bottom-most (0) to top-most (2)
  for (let i = 0; i < 3; i++) {
    drawCutoutLayer(i);
  }
}

function drawCutoutLayer(index) {
  // We use a temporary graphics buffer to perform the "punch out"
  let temp = createGraphics(width, height);
  
  // 1. Draw the solid sheet
  temp.fill(palette[index]);
  temp.noStroke();
  temp.rect(0, 0, width, height);
  
  // 2. Punch the holes
  temp.erase(); 
  //temp.stroke(0);
  //temp.strokeWeight(8);
  for (let c of circleData[index]) {
    temp.ellipse(c.x, c.y, c.r * 2);
  }
  temp.noErase();
  
  /*
  // Outline each circle
  temp.stroke(200); //light grey
  temp.strokeWeight(3);
  temp.noFill();
  for (let c of circleData[index]) {
    temp.ellipse(c.x, c.y, c.r * 2);
  }
  */

  // 3. Apply Shadow to the main canvas context before drawing the sheet
  drawingContext.shadowOffsetX = 10;
  drawingContext.shadowOffsetY = 10;
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.7)';

  image(temp, 0, 0);
  
  // Clean up shadow so it doesn't bleed into other logic
  drawingContext.shadowBlur = 0;
  temp.remove(); // Free up memory
}

function packLayer(index, maxCircles) {
  let attempts = 0;
  while (circleData[index].length < maxCircles && attempts < 12000) {
    let newC = {
      x: random(width),
      y: random(height),
      r: random(20, index === 2 ? 160 : 100) 
    };
    
    let overlapping = false;
    for (let other of circleData[index]) {
      if (dist(newC.x, newC.y, other.x, other.y) < newC.r + other.r + 5) {
        overlapping = true;
        break;
      }
    }
    
    if (!overlapping) circleData[index].push(newC);
    attempts++;
  }
}