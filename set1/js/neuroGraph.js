// Neurographic Art Style with Flood Fill Coloring
// by GEmini
let lines = [];
let numLines = 12;
let jointRadius = 30;
let palette;

function setup() {
  createCanvas(800, 800);
  pixelDensity(1); // Important for the floodFill performance
  
  // A nice "Arcane" style palette
  palette = [
    color(60, 90, 100),   // Deep Teal
    color(200, 150, 50),  // Gold/Ochre
    color(180, 80, 80),   // Muted Red
    color(40, 40, 50),    // Dark Grey
    color(240, 240, 230)  // Off-white
  ];

  // 1. Generate Lines that span the FULL canvas
  for (let i = 0; i < numLines; i++) {
    // Start with random points
    let p1 = createVector(random(width), random(height));
    let p2 = createVector(random(width), random(height));
    
    // Extend them to the borders
    lines.push(extendLineToBorder(p1, p2));
  }
  
  // 2. Render the Scene
  background(255);
  
  // Step A: Draw the black "Structure" first (thick lines) to act as dams for the color
  stroke(0);
  strokeWeight(2);
  for (let l of lines) {
    line(l.p1.x, l.p1.y, l.p2.x, l.p2.y);
  }
  
  // Step B: Apply Neurographic Joints (The Curves)
  fill(0);
  noStroke();
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let intersection = findIntersection(lines[i], lines[j]);
      if (intersection) {
        drawNeuroJoint(intersection, lines[i], lines[j], jointRadius);
      }
    }
  }
  
  // Step C: The "Paint Bucket" (Flood Fill)
  // We pick random spots. If it's white, we fill that region.
  loadPixels(); // Lock the canvas for pixel manipulation
  for(let i=0; i<200; i++) { // Try 200 random spots
    let x = int(random(width));
    let y = int(random(height));
    
    // Check if this pixel is White (255, 255, 255)
    // (We check the Red channel '0' of the pixel array)
    let index = 4 * (y * width + x);
    if (pixels[index] > 250 && pixels[index+1] > 250) { 
      // It's white! Fill it!
      let col = random(palette);
      floodFill(x, y, col);
    }
  }
  updatePixels();
  
  // Step D: Redraw the black lines/joints on TOP so they look clean
  // (The flood fill can look jagged, so we cover the edges)
  stroke(0);
  strokeWeight(3); // Thicker this time
  for (let l of lines) {
     line(l.p1.x, l.p1.y, l.p2.x, l.p2.y);
  }
  noStroke();
  fill(0);
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let intersection = findIntersection(lines[i], lines[j]);
      if (intersection) drawNeuroJoint(intersection, lines[i], lines[j], jointRadius+2);
    }
  }
}

// --- Helper: Extend Line to Borders ---
function extendLineToBorder(p1, p2) {
  // Slope formula
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  
  // If line is vertical/horizontal, handle edge case (omitted for brevity)
  let m = dy / dx;
  let b = p1.y - m * p1.x;
  
  let candidates = [];
  
  // Calculate intersections with 4 borders:
  // 1. Left (x=0) -> y = b
  candidates.push(createVector(0, b));
  // 2. Right (x=width) -> y = m*w + b
  candidates.push(createVector(width, m * width + b));
  // 3. Top (y=0) -> x = -b/m
  candidates.push(createVector(-b / m, 0));
  // 4. Bottom (y=height) -> x = (h-b)/m
  candidates.push(createVector((height - b) / m, height));
  
  // Filter points that are actually ON the canvas border
  let validPoints = candidates.filter(p => 
    p.x >= -1 && p.x <= width + 1 && p.y >= -1 && p.y <= height + 1
  );
  
  // We usually get 2 valid points (entry and exit)
  // If we get more (corners), just pick the first and last
  if (validPoints.length >= 2) {
    return { p1: validPoints[0], p2: validPoints[validPoints.length-1] };
  }
  return { p1: p1, p2: p2 }; // Fallback
}

// --- Helper: Standard Recursive Flood Fill ---
function floodFill(x, y, fillColor) {
  // Use a stack-based flood fill to avoid "Maximum call stack size exceeded"
  let stack = [[x, y]];
  
  // Get color components
  let r = red(fillColor);
  let g = green(fillColor);
  let b = blue(fillColor);
  
  while (stack.length > 0) {
    let curr = stack.pop();
    let cx = curr[0];
    let cy = curr[1];
    
    // Bounds check
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
    
    let idx = 4 * (cy * width + cx);
    
    // If not white, skip
    if (pixels[idx] < 250) continue;
    
    // Color it
    pixels[idx] = r;
    pixels[idx+1] = g;
    pixels[idx+2] = b;
    pixels[idx+3] = 255;
    
    // Add neighbors
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
}

// --- Same Intersection Math from before ---
function findIntersection(l1, l2) {
  let x1 = l1.p1.x, y1 = l1.p1.y, x2 = l1.p2.x, y2 = l1.p2.y;
  let x3 = l2.p1.x, y3 = l2.p1.y, x4 = l2.p2.x, y4 = l2.p2.y;
  let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den == 0) return null; 
  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}

function drawNeuroJoint(center, l1, l2, r) {
  // (Same code as previous example)
  // Re-paste the 'drawNeuroJoint' and 'drawCurve' functions here
   let getPoint = (target) => {
    let dir = p5.Vector.sub(target, center).normalize().mult(r);
    return p5.Vector.add(center, dir);
  }
  let pA1 = getPoint(l1.p1);
  let pA2 = getPoint(l1.p2);
  let pB1 = getPoint(l2.p1);
  let pB2 = getPoint(l2.p2);
  
  drawCurve(pA1, center, pB1);
  drawCurve(pB1, center, pA2);
  drawCurve(pA2, center, pB2);
  drawCurve(pB2, center, pA1);
}

function drawCurve(start, control, end) {
  beginShape();
  vertex(start.x, start.y);
  quadraticVertex(control.x, control.y, end.x, end.y);
  vertex(control.x, control.y); 
  endShape(CLOSE);
}