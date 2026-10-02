// Creates a generative contact sheet
// Each cell varies a key parameter to showcase different outputs
//
// Inspired by "Arcane" art style: dark, moody, with glowing energy lines   
/*

The "Restless Experimenter" Tweaks
This structure is a template. You can swap out the engine easily.

Change the Parameter: Instead of mapping noise scale, try mapping numTrails.

Change this line: let noiseScale = map(i, 0, cols - 1, 0.002, 0.05) + (j * 0.001);

To something like: let trailCountParam = map(i, 0, cols-1, 50, 1000);

Then update drawCellContent to accept and use that new count. You'll get a grid showing sparse vs. dense density.

Change the Algorithm:

Delete the insides of drawCellContent.

Paste in the logic for a recursive rectangle or a small L-System tree.

Use the grid position (i, j) to change the recursion depth or the branch angle.

*/

// Grid settings
let cols = 4;
let rows = 4;

// Padding between cells for that "contact sheet" look
let padding = 10;

function setup() {
  // A square canvas works best for a grid
  createCanvas(800, 800);
  noLoop(); // We only want to generate the sheet once
  rectMode(CORNER);
}

function draw() {
  background(25); // Dark, "Arcane" gloom background

  // Calculate dimensions of an individual cell
  let totalCellWidth = width / cols;
  let totalCellHeight = height / rows;
  let innerW = totalCellWidth - padding * 2;
  let innerH = totalCellHeight - padding * 2;

  // --- THE NESTED LOOPS (The Grid Engine) ---
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      
      // Calculate top-left corner of current cell
      let x = i * totalCellWidth + padding;
      let y = j * totalCellHeight + padding;

      // --- THE EXPERIMENT ---
      // We map the column index (i) to a noise scale parameter.
      // Column 0 gets 0.002 (smooth), Column 3 gets 0.05 (chaotic).
      // We add a tiny bit of randomness per row (j*0.001) so cells in the same column aren't identical twins.
      let noiseScale = map(i, 0, cols - 1, 0.002, 0.05) + (j * 0.001);

      // Draw the generative sketch inside this specific cell boundary
      drawCellContent(x, y, innerW, innerH, noiseScale);

      // Draw cell border (the film strip edge)
      noFill();
      stroke(80);
      strokeWeight(1);
      rect(x, y, innerW, innerH);
      
      // Label the data point (for the Data Architect)
      fill(180);
      noStroke();
      textSize(10);
      textFont('Courier New');
      textAlign(LEFT, BOTTOM);
      text("N.Scale: " + nfc(noiseScale, 4), x + 5, y + innerH - 5);
    }
  }
}

// --- THE GENERATIVE ALGORITHM ---
// This function runs the actual sketch inside the defined boundaries (bx, by, bw, bh)
// using the specific parameter passed to it.
function drawCellContent(bx, by, bw, bh, nScale) {
  // We'll draw many faint lines to create a textured "sketch" look
  let numTrails = 300; 
  let trailLength = 60;
  
  stroke(200, 220, 255, 40); // Pale blue-white, very transparent (Arcane energy color)
  strokeWeight(1);
  noFill();

  for (let k = 0; k < numTrails; k++) {
    // Start at a random point WITHIN the cell boundaries
    let px = random(bx, bx + bw);
    let py = random(by, by + bh);

    beginShape();
    for (let step = 0; step < trailLength; step++) {
      vertex(px, py);
      
      // Calculate angle using Perlin noise based on current position AND the passed scale
      // We multiply coordinates by nScale to zoom in/out of the noise space.
      // We add bx/by to the noise lookup to ensure different parts of the canvas use different noise.
      let angle = noise((px + bx) * nScale, (py + by) * nScale) * TWO_PI * 4;
      
      // Move forward
      px += cos(angle) * 2;
      py += sin(angle) * 2;

      // STOP if the trail tries to leave the cell boundary
      if (px < bx || px > bx + bw || py < by || py > by + bh) {
        break; 
      }
    }
    endShape();
  }
}

function mousePressed() {
  // Click to generate a fresh sheet with new random starting positions
  redraw();
}

function keyPressed() {
  if (key === 's') {
    saveCanvas('generative_contact_sheet', 'png');
  }
}