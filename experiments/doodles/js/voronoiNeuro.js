/* Standalone Vector Voronoi (No Libraries Needed)
  Algorithm: Sutherland-Hodgman Polygon Clipping
  Author: Gemini (for Chris)
*/

let seeds = [];
let numSeeds = 50; // Keep < 200 for performance

function setup() {
  createCanvas(windowWidth, windowHeight);
  //noLoop();
  frameRate(2);
  // 1. Generate Seeds

}

function draw() {
  seeds = [];
  for (let i = 0; i < numSeeds; i++) {
    seeds.push(createVector(random(width), random(height)));
  }
  background(20); // Dark background for contrast
  
  // Style for the "Cells"
  fill(255);      // White cells
  stroke(20);     // Dark borders matches background
  strokeWeight(4); // Thicker lines emphasize the gaps
  
  for (let i = 0; i < seeds.length; i++) {
    let poly = getVoronoiCell(i);
    drawNeuroPoly(poly, 0.85); // 0.85 is the "Roundness" (0 to 1.0)
  }
}

// --- CORE ALGORITHM ---

function getVoronoiCell(targetIndex) {
  let target = seeds[targetIndex];
  
  // Start with a polygon covering the whole canvas (plus buffer)
  let poly = [
    createVector(-100, -100),
    createVector(width + 100, -100),
    createVector(width + 100, height + 100),
    createVector(-100, height + 100)
  ];

  // Clip this polygon against the bisector of every other seed
  for (let i = 0; i < seeds.length; i++) {
    if (i === targetIndex) continue; // Don't check against self

    let other = seeds[i];
    
    // Calculate perpendicular bisector
    // The line passes through the midpoint between target and other
    let mid = p5.Vector.add(target, other).div(2);
    
    // The normal vector points away from the 'other' seed towards 'target'
    // (We want to keep the side closer to 'target')
    let normal = p5.Vector.sub(target, other).normalize();

    // Clip the polygon
    poly = clipPolygon(poly, mid, normal);
    
    // Optimization: If polygon is gone, stop
    if (poly.length === 0) break;
  }
  return poly;
}

// Sutherland-Hodgman clipper
function clipPolygon(subjectPoly, p, n) {
  let newPoly = [];
  
  if(subjectPoly.length === 0) return newPoly;

  for (let i = 0; i < subjectPoly.length; i++) {
    let curr = subjectPoly[i];
    let prev = subjectPoly[(i + subjectPoly.length - 1) % subjectPoly.length];

    // Check if points are "inside" (on the correct side of the clipping line)
    // We use dot product with the normal to determine side
    let currIn = p5.Vector.sub(curr, p).dot(n) > 0;
    let prevIn = p5.Vector.sub(prev, p).dot(n) > 0;

    if (currIn) {
      if (!prevIn) {
        // Entered the valid side: add intersection point
        newPoly.push(intersect(prev, curr, p, n));
      }
      newPoly.push(curr);
    } else if (prevIn) {
      // Left the valid side: add intersection point
      newPoly.push(intersect(prev, curr, p, n));
    }
  }
  return newPoly;
}

// Line-Plane intersection
function intersect(a, b, p, n) {
  // Line segment ab, Plane point p, Plane normal n
  let ab = p5.Vector.sub(b, a);
  let ap = p5.Vector.sub(p, a);
  let t = ap.dot(n) / ab.dot(n);
  return p5.Vector.add(a, p5.Vector.mult(ab, t));
}
// --- NEW HELPER FUNCTION ---

/* Draws a polygon with rounded corners.
  factor: 0.0 = sharp squares, 0.5 = fully circular/organic, 1.0 = highly distorted
*/
function drawNeuroPoly(poly, factor) {
  if (poly.length < 3) return;

  beginShape();
  
  // 1. Start at a point partly along the LAST edge
  // This ensures the loop closes smoothly
  let lastPt = poly[poly.length - 1];
  let firstPt = poly[0];
  
  // Calculate the starting point interpolated between the last and first vertex
  let startX = lerp(lastPt.x, firstPt.x, factor);
  let startY = lerp(lastPt.y, firstPt.y, factor);
  vertex(startX, startY);

  // 2. Loop through all vertices to create curves
  for (let i = 0; i < poly.length; i++) {
    let current = poly[i];
    let next = poly[(i + 1) % poly.length];
    
    // Calculate the point partly along the NEXT edge
    let nextX = lerp(current.x, next.x, factor);
    let nextY = lerp(current.y, next.y, factor);
    
    // Draw curve using the actual corner (current) as the control point
    // quadraticVertex(controlX, controlY, anchorX, anchorY)
    quadraticVertex(current.x, current.y, nextX, nextY);
  }
  
  endShape(CLOSE);
}

function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('voronoiNeuro_' + timeStamp);
    }
}