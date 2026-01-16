let depthSlider, sizeSlider;
let showRectangles = true; // toggle for showing rectangles
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

function setup() {
  createCanvas(800, 800);
  angleMode(RADIANS);
  
  // Slider for recursion depth
  depthSlider = createSlider(1, 10, 6, 1);
  depthSlider.position(10, height + 10);
  depthSlider.style('width', '580px');
  
  // Slider for the initial square size
  sizeSlider = createSlider(50, 400, 150, 1);
  sizeSlider.position(10, height + 40);
  sizeSlider.style('width', '580px');
}

function draw() {
  background(255);
  
  // Center the drawing
  translate(0, 80);
  
  // Get current slider values
  let s = sizeSlider.value();
  let iterations = depthSlider.value();
  
  stroke(0);
  strokeWeight(2);
  noFill();
  
  // Draw the golden spiral (and rectangles if toggled on)
  drawSpiral(s, iterations);
  
  // Display current settings
  push();
  resetMatrix();
  fill(0);
  noStroke();
  textSize(16);
  text("Iterations: " + iterations, 10, 20);
  text("Initial size: " + s, 10, 40);
  text("Rectangles: " + (showRectangles ? "ON (press 'r' to toggle)" : "OFF (press 'r' to toggle)"), 10, 60);
  pop();
}

// Recursive function to draw the spiral and optionally its rectangles
function drawSpiral(a, n) {
  if (n <= 0) return;
  
  // Optionally draw the square (our "rectangle" here) for this step.
  // The square starts at (0,0) with side length 'a'.
  if (showRectangles) {
    rect(0, 0, a, a);
  }
  
  // Draw the quarter circle arc inside the square.
  // The arc is drawn with center at (a, a) so that it spans from the top-right
  // to the bottom-left of the square.
  arc(a, a, 2 * a, 2 * a, PI, PI + HALF_PI);
  
  // Prepare for the next recursive step:
  push();
    // Move to the bottom-right corner of the current square.
    translate(a, a);
    // Rotate 90° clockwise to position the next square correctly.
    rotate(-HALF_PI);
    // Recursively draw the next part of the spiral, scaling the square by 1/φ.
    drawSpiral(a / phi, n - 1);
  pop();
}

// Toggle rectangle drawing with the 'r' key.
function keyPressed() {
  if (key === 'r' || key === 'R') {
    showRectangles = !showRectangles;
  }
}
