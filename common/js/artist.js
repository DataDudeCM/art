class BrushArtist {
  // A more complex brush painting library inspired by real-world techniques
  // Features:
  // 1. Velocity Sensing: Thinner strokes when moving fast, thicker when slow
  // 2. Pigment Loading / Fade-out: Brush "dries" as you paint, requiring refills
  // 3. Ghosting Technique: Multi-pass layering for richer textures (inspired by your 'sketchyLine.js' multi-stroke logic)  
  // 4. Brush Angle: Rotate brush based on stroke direction for more natural marks 
  // 5. Customizable Brush Shapes: Use any image as a brush tip (e.g., your "Creamy.png")
  // 6. Dynamic Stroke Variation: Randomize size and opacity for more organic results
  // Usage:
  // painter = new BrushArtist(myBrushImage);
  // painter.paintStroke(x, y, px, py, { color, size, opacity, ghosting }); 
  // painter.refill(); // Call to "dip the brush back in paint"
  // Note: This library is designed for p5.js and assumes the brush image is preloaded.
  //   -- the 2nd point passed determines the direction and speed of the stroke, allowing for dynamic brush behavior based on user input.
  //   -- the distance between the 2nd point and the current point determines how many additional brush strokes are drawn between them, creating a richer texture for longer strokes while keeping shorter strokes more precise.
  //   -- if the 2nd point is the same as the current point, it will still draw a single brush stroke at that location, allowing for dotting or stamping effects.
  //   -- to create a directional brush stroke, the 2nd point should be at least 1 pixel away from the current point to avoid division by zero when calculating the angle. If they are the same, the angle will default to 0, resulting in a non-rotated brush stamp.
  constructor(brushImg) {
    this.brush = brushImg;
    this.distanceTravelled = 0;
    this.maxPigmentDistance = 1000; // Total pixels a brush can go before "dry"
  }

  /**
   * Main painting function
   * @param {number} x, y - Current coordinates
   * @param {number} px, py - Previous coordinates (for velocity)
   * @param {Object} options - { color, size, opacity, ghosting, angle }
   */
  paintStroke(x, y, px, py, options = {}) {
    // Consider making the 2nd point optional, defaulting to the current point for stamping effects
    if (px === undefined || py === undefined) {
      px = x;
      py = y;
    }
    let {
      strokeColor = color(0),
      size = 20,
      opacity = 50,
      ghosting = 3, // Number of "under-passes"
      angle = atan2(y - py, x - px)
    } = options;



    // 1. Velocity Sensing: Thinner strokes when moving fast
    let speed = dist(x, y, px, py);
    let dynamicSize = map(speed, 0, 50, size, size * 0.5); // Adjust size based on speed (tweak as needed)


    // 2. Pigment Loading / Fade-out
    this.distanceTravelled += speed;
    let pigmentRefill = map(this.distanceTravelled, 0, this.maxPigmentDistance, 1, 0.1);
    let currentAlpha = opacity * pigmentRefill;

    // Stop drawing if the brush is dry
    if (currentAlpha < 1) return;

    // Add section to draw additional strokes between the two points, with the number of strokes based on the distance between the two points, so that we have more strokes for longer segments and fewer for shorter segments
    let segmentLength = dist(x, y, px, py);
    let numSubStrokes = floor(segmentLength / 2); // 1 substroke every 10 pixels
    if (numSubStrokes < 1) numSubStrokes = 1; // Ensure at least one substroke
    for (let i = 1; i <= numSubStrokes; i++) {
      let t = i / (numSubStrokes + 1);
      let subX = lerp(px, x, t);
      let subY = lerp(py, y, t);
          // 3. Ghosting Technique (Multi-pass layering)
      // Inspired by your 'sketchyLine.js' multi-stroke logic
      for (let i = 0; i < ghosting; i++) {
        let isFinalPass = i === ghosting - 1;
        let passSize = isFinalPass ? dynamicSize : dynamicSize * (1 + i * 0.2);
        let passAlpha = isFinalPass ? currentAlpha : currentAlpha * 0.3;
        
        let jitterX = random(-2, 2);
        let jitterY = random(-2, 2);
        this._drawStamp(subX + jitterX, subY + jitterY, passSize, angle, strokeColor, passAlpha);
      }
    }
  }

  // Internal helper to stamp the brush image
  _drawStamp(x, y, size, angle, c, a) {
    push();
    translate(x, y);
    rotate(angle);
    tint(red(c), green(c), blue(c), a);
    imageMode(CENTER);
    // Scales brush based on original image dimensions from brush.js
    let renderSize = this.brush.width * (size * 0.01);
    image(this.brush, 0, 0, renderSize, renderSize);
    pop();
  }

  // Call this to "dip the brush back in paint"
  refill() {
    this.distanceTravelled = 0;
  }
}


function sketchyPaintedLine(x1, y1, x2, y2) {
  const numStrokes = 2;   // Total number of strokes
  const numPoints = 40;   // Number of points along the line
  const jiggyness = 2; // Max random jitter for points

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
      let x = lerp(x1, x2, t) + random(-jiggyness, jiggyness);
      let y = lerp(y1, y2, t) + random(-jiggyness, jiggyness);
      points.push({ x, y });
    }

    // Draw the line in segments, inserting random breaks.
    painter.refill();
    for (let j = 1; j < points.length; j++) {
        painter.paintStroke(points[j].x, points[j].y, points[j-1].x, points[j-1].y, {
          strokeColor: color('#232a3f'), // Using your Palette #1
          size: 2,
          opacity: 10,
        ghosting: 4
        }) ;
      }
    }
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