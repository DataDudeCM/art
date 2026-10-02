let slider;
let numPoints = 20; // initial number of sample points (should be even)
let curve1 = [];
let curve2 = [];
let curve3 = [];
let button;

function setup() {
  createCanvas(800, 800);
  
  // Create a slider to control the number of sample points (even numbers only)
  slider = createSlider(4, 150, 10, 2);
  slider.position(10, height + 10);
  slider.style('width', '200px');
  
  // Button to regenerate new random curves (i.e., new control points)
  button = createButton("Generate New Curves");
  button.position(220, height + 10);
  button.mousePressed(regenerateCurves);
  
  regenerateCurves();
}

function draw() {
  background(0);
  
  // Update the number of points from the slider
  numPoints = slider.value();
  
  // Update control points for each curve
  for (let cp of curve1) {
    cp.update();
  }
  for (let cp of curve2) {
    cp.update();
  }
  for (let cp of curve3) {
    cp.update();
  }
  
  // Compute sample points along each bezier curve based on current control point positions
  let pts1 = [];
  let pts2 = [];
  let pts3 = [];
  
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1);
    
    // Curve 1
    let x1 = bezierPoint(curve1[0].pos.x, curve1[1].pos.x, curve1[2].pos.x, curve1[3].pos.x, t);
    let y1 = bezierPoint(curve1[0].pos.y, curve1[1].pos.y, curve1[2].pos.y, curve1[3].pos.y, t);
    pts1.push(createVector(x1, y1));
    
    // Curve 2
    let x2 = bezierPoint(curve2[0].pos.x, curve2[1].pos.x, curve2[2].pos.x, curve2[3].pos.x, t);
    let y2 = bezierPoint(curve2[0].pos.y, curve2[1].pos.y, curve2[2].pos.y, curve2[3].pos.y, t);
    pts2.push(createVector(x2, y2));
    
    // Curve 3
    let x3 = bezierPoint(curve3[0].pos.x, curve3[1].pos.x, curve3[2].pos.x, curve3[3].pos.x, t);
    let y3 = bezierPoint(curve3[0].pos.y, curve3[1].pos.y, curve3[2].pos.y, curve3[3].pos.y, t);
    pts3.push(createVector(x3, y3));
  }
  
  // Draw each of the three bezier curves
  noFill();
  strokeWeight(2);
  
  // Curve 1 in black
  stroke(255);
  beginShape();
  for (let p of pts1) {
    vertex(p.x, p.y);
  }
  endShape();
  
  // Curve 2 in a red hue
  stroke(150, 0, 0);
  beginShape();
  for (let p of pts2) {
    vertex(p.x, p.y);
  }
  endShape();
  
  // Curve 3 in a blue hue
  stroke(0, 0, 150);
  beginShape();
  for (let p of pts3) {
    vertex(p.x, p.y);
  }
  endShape();
  
  // Function to compute alpha based on position along the curve
  // t ranges from 0 to 1. The center is at t=0.5. We map the distance from center
  // so that points at t=0.5 get alpha 255 and points at t=0 or t=1 get a lower alpha.
  function computeAlpha(t) {
    let d = abs(t - 0.5); // distance from the center (max is 0.5)
    return map(d, 0, 0.5, 255, 40);
  }
  
  // Connect the curves pairwise with variable transparency
  
  // Connect Curve 1 to Curve 2 (using reversed order for Curve 2)
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1);
    let alphaVal = computeAlpha(t);
    let p1 = pts1[i];
    let p2 = pts2[numPoints - 1 - i];
    stroke(100, alphaVal);
    strokeWeight(1);
    line(p1.x, p1.y, p2.x, p2.y);
  }
  
  // Connect Curve 2 to Curve 3 (using reversed order for Curve 3)
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1);
    let alphaVal = computeAlpha(t);
    let p1 = pts2[i];
    let p2 = pts3[numPoints - 1 - i];
    stroke(100, 0, 100, alphaVal);
    line(p1.x, p1.y, p2.x, p2.y);
  }
  
  // Connect Curve 3 back to Curve 1 (using reversed order for Curve 1)
  for (let i = 0; i < numPoints; i++) {
    let t = i / (numPoints - 1);
    let alphaVal = computeAlpha(t);
    let p1 = pts3[i];
    let p2 = pts1[numPoints - 1 - i];
    stroke(0, 150, 150, alphaVal);
    line(p1.x, p1.y, p2.x, p2.y);
  }
  

}

// Class for moving control points
class ControlPoint {
  constructor(x, y) {
    this.pos = createVector(x, y);
    // Random velocity; tweak the multiplier to adjust speed
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
  }
  
  update() {
    this.pos.add(this.vel);
    // Bounce off the canvas edges
    if (this.pos.x < 0 || this.pos.x > width) {
      this.vel.x *= -1;
    }
    if (this.pos.y < 0 || this.pos.y > height) {
      this.vel.y *= -1;
    }
  }
}

// Generate new sets of control points for all three curves
function regenerateCurves() {
  curve1 = [];
  curve2 = [];
  curve3 = [];
  for (let i = 0; i < 4; i++) {
    curve1.push(new ControlPoint(random(width), random(height)));
    curve2.push(new ControlPoint(random(width), random(height)));
    curve3.push(new ControlPoint(random(width), random(height)));
  }
}
