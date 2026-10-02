// Configuration
let maxDepth = 8; // How deep the recursion can go

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); 
  //frameRate(1);
  rectMode(CORNER);
}

function draw() {
  background(25); // Dark Arcane background
  
  // Start the recursion from the full canvas size
  // Arguments: x, y, width, height, current depth
  divideRect(10, 10, windowWidth - 20, windowHeight - 20, 0);
}

// --- THE RECURSIVE ENGINE ---
function divideRect(x, y, w, h, depth) {
  // 1. DECISION: Should we split this rectangle?
  // We stop if we hit max depth or if the box is too small.
  // We also add a random chance to stop early (0.3) for variation.
  if (depth >= maxDepth || w < 50 || h < 50 || random() < 0.4) {
    
    // We reached a "leaf" node. Draw the content!
    drawPanel(x, y, w, h, depth);
    return;
  }

  // 2. SPLIT LOGIC
  // Decide split direction based on aspect ratio to keep boxes roughly square-ish
  let splitHoriz = w > h; 
  if (w == h) splitHoriz = random() > 0.5;

  if (splitHoriz) {
    // Vertical split (creating Left and Right panels)
    // Randomize the split point (30% to 70%)
    let splitW = random(0.3, 0.7) * w;
    divideRect(x, y, splitW, h, depth + 1);
    divideRect(x + splitW, y, w - splitW, h, depth + 1);
  } else {
    // Horizontal split (creating Top and Bottom panels)
    let splitH = random(0.3, 0.7) * h;
    divideRect(x, y, w, splitH, depth + 1);
    divideRect(x, y + splitH, w, h - splitH, depth + 1);
  }
}

// --- THE CONTENT DRAWER ---
function drawPanel(x, y, w, h, depth) {
  // A. VISUALIZE THE GRID
  /*
  noFill();
  stroke(80);
  strokeWeight(1);
  rect(x, y, w, h);
  */

  // B. CALCULATE PARAMETERS BASED ON DEPTH
  // Deeper depth (smaller box) = Higher noise scale (more chaotic)
  // Depth 0: 0.002 (Very smooth)
  // Depth 5: 0.05 (Very frantic)
  let noiseScale = map(depth, 0, maxDepth, 0.002, 0.05);
  
  // Optional: Vary the color based on depth too?
  // let alpha = map(depth, 0, maxDepth, 20, 100); 
  
  // C. DRAW THE GENERATIVE ART
  // We add a small padding so the art doesn't touch the borders
  let pad = 1;
  drawFlowField(x + pad, y + pad, w - pad*2, h - pad*2, noiseScale, depth);
  
  // D. LABEL (Optional - remove if you want pure art)
  noStroke();
  fill(150);
  textSize(10);
  textAlign(LEFT, TOP);
  //text("D:" + depth, x + 5, y + 5);
}

// --- THE ART GENERATOR (Flow Field) ---
function drawFlowField(bx, by, bw, bh, nScale, depth) {
  // Density of lines depends on box size
  let area = bw * bh;
  let numTrails = map(area, 2500, 640000, 50, 2000); 
  let trailLength = 80;
  let r = (10-depth)*.5; // Circle size decreases with depth
  
  stroke(200, 220, 255, 60); // Ghostly blue
  strokeWeight(1);
  noFill();

  for (let k = 0; k < numTrails; k++) {
    let px = random(bx, bx + bw);
    let py = random(by, by + bh);

    beginShape();
    for (let step = 0; step < trailLength; step++) {
      
      // Occasionally draw circles along the path
      if (random() < 0.005) {
        fill(255);
        ellipse(px, py, r, r);
        noFill();
      }

      vertex(px, py);
      
      // The Magic: Using the coordinate + nScale to determine direction
      let angle = noise(px * nScale, py * nScale) * TWO_PI * 4;
      
      px += cos(angle) * 2;
      py += sin(angle) * 2;

      // Containment check
      if (px < bx || px > bx + bw || py < by || py > by + bh) {
        break; 
      }
    }
    endShape();
  }
}

function mousePressed() {
  redraw();
}

function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('recursiveRectPerlin_' + timeStamp);
    }
}