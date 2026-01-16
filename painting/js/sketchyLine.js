function setup() {
  createCanvas(600, 400);
  background(255); // White background
  strokeWeight(2);
  noLoop(); // Only draw once
}

function draw() {
  // Draw a sketchy line from (50, 200) to (550, 200)
  sketchLine(50, 200, 550, 200);
}

function sketchLine(x1, y1, x2, y2) {
  const numStrokes = 5;   // Total number of strokes
  const numPoints = 30;   // Number of points along the line
  const breakProbability = 0.1; // Chance to create a break between points
  const overlapCount = 2; // How many points to overlap between segments

  for (let i = 0; i < numStrokes; i++) {
    // Set transparency for all strokes except the final one.
    if (i < numStrokes - 1) {
      stroke(0, 40); // Semi-transparent stroke
    } else {
      stroke(0,200);     // Fully opaque stroke for the final pass
    }

    // Generate points with random jitter.
    let points = [];
    for (let j = 0; j < numPoints; j++) {
      let t = j / (numPoints - 1);
      let x = lerp(x1, x2, t) + random(-2, 2);
      let y = lerp(y1, y2, t) + random(-2, 2);
      points.push({ x, y });
    }

    // Draw the line in segments, inserting random breaks.
    beginShape();
    for (let j = 0; j < points.length; j++) {
      vertex(points[j].x, points[j].y);

      // Check for break condition (but not after the final point).
      if (j < points.length - 1 && random(1) < breakProbability) {
        endShape(); // End the current segment to create a break
        
        // Begin a new shape with a slight overlap.
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
