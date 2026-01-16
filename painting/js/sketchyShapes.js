function setup() {
    createCanvas(600, 400);
    background(255);
    noLoop();
  }
  
  function draw() {
    // --- Draw a watercolor-filled rectangle with a sketchy outline ---
    fillWatercolorRect(50, 50, 150, 100, color(150, 200, 250, 80)); // Light blue fill
    drawSketchyRect(50, 50, 150, 100);
    
    // --- Draw a watercolor-filled triangle with a sketchy outline ---
    fillWatercolorTriangle(300, 50, 450, 150, 250, 200, color(250, 150, 200, 80)); // Light pink fill
    drawSketchyTriangle(300, 50, 450, 150, 250, 200);
    
    // --- Draw a watercolor-filled square with a sketchy outline ---
    fillWatercolorRect(350, 250, 100, 100, color(200, 250, 150, 80)); // Light green fill
    drawSketchySquare(350, 250, 100);
  }
  
  
  // ========================================================
  // Watercolor Fill Functions
  // ========================================================
  
  function fillWatercolorRect(x, y, w, h, fillColor) {
    noStroke();
    const numStrokes = 1000; // Increase for a denser wash
    for (let i = 0; i < numStrokes; i++) {
      // Slightly vary the fill color to create a bleeding effect
      let r = red(fillColor) + random(-10, 10);
      let g = green(fillColor) + random(-10, 10);
      let b = blue(fillColor) + random(-10, 10);
      let a = alpha(fillColor);
      fill(r, g, b, 20);
      
      // Pick a random point within the rectangle
      let rx = random(x, x + w);
      let ry = random(y, y + h);
      
      // Random ellipse size
      let size = random(5, 25);
      ellipse(rx, ry, size, size);
    }
  }
  
  function fillWatercolorTriangle(x1, y1, x2, y2, x3, y3, fillColor) {
    noStroke();
    const numStrokes = 800; // Increase for a denser wash
    for (let i = 0; i < numStrokes; i++) {
      // Vary the color slightly
      let r = red(fillColor) + random(-10, 10);
      let g = green(fillColor) + random(-10, 10);
      let b = blue(fillColor) + random(-10, 10);
      let a = alpha(fillColor);
      fill(r, g, b, 20);
      
      // Generate a random point inside the triangle using barycentric coordinates.
      let r1 = random();
      let r2 = random();
      if (r1 + r2 > 1) { 
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      let px = x1+2 + r1 * (x2-2 - x1) + r2 * (x3 - x1);
      let py = y1-2 + r1 * (y2-2 - y1) + r2 * (y3 - y1);
      
      let size = random(5, 25);
      ellipse(px, py, size, size);
    }
  }
  
  
  // ========================================================
  // Sketchy Outline Functions
  // ========================================================
  
  // Draws a sketchy line with random breaks and overlapping segments.
  function sketchLine(x1, y1, x2, y2) {
    const numStrokes = 5;       // Total strokes for the edge
    const numPoints = 30;       // Points along each stroke
    const breakProbability = 0.1; // Chance to create a break between points
    const overlapCount = 2;     // Number of points to overlap between segments
  
    for (let i = 0; i < numStrokes; i++) {
      // Use transparency for all strokes except the final one.
      if (i < numStrokes - 1) {
        stroke(0, 50); // Semi-transparent stroke
      } else {
        stroke(0);     // Fully opaque stroke for the final pass
      }
      
      // Generate points along the line with some random jitter.
      let points = [];
      for (let j = 0; j < numPoints; j++) {
        let t = j / (numPoints - 1);
        let x = lerp(x1, x2, t) + random(-2, 2);
        let y = lerp(y1, y2, t) + random(-2, 2);
        points.push({ x, y });
      }
      
      // Draw the line in segments, creating breaks randomly.
      beginShape();
      for (let j = 0; j < points.length; j++) {
        vertex(points[j].x, points[j].y);
        
        // Occasionally break the line (except after the final point)
        if (j < points.length - 1 && random(1) < breakProbability) {
          endShape();
          // Begin a new segment with a slight overlap for a smoother transition.
          beginShape();
          let startOverlap = max(j - overlapCount, 0);
          for (let k = startOverlap; k <= j; k++) {
            vertex(points[k].x, points[k].y);
          }
        }
      }
      endShape();
    }
  }
  
  // Draws a rectangle by sketching each of its four edges.
  function drawSketchyRect(x, y, w, h) {
    // Top edge
    sketchLine(x, y, x + w, y);
    // Right edge
    sketchLine(x + w, y, x + w, y + h);
    // Bottom edge
    sketchLine(x + w, y + h, x, y + h);
    // Left edge
    sketchLine(x, y + h, x, y);
  }
  
  // Draws a triangle by connecting its three vertices with sketchy lines.
  function drawSketchyTriangle(x1, y1, x2, y2, x3, y3) {
    sketchLine(x1, y1, x2, y2);
    sketchLine(x2, y2, x3, y3);
    sketchLine(x3, y3, x1, y1);
  }
  
  // Draws a square (a rectangle with equal width and height).
  function drawSketchySquare(x, y, size) {
    drawSketchyRect(x, y, size, size);
  }
  