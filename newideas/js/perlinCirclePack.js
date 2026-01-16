let circles = [];
let totalCircles = 500; // How many circles to attempt to pack
let attempts = 2000; // How hard we try to fit them in

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB,255, 100);
  noLoop();
  
  // 1. GENERATE THE CIRCLE PACKING
  // We try to place circles randomly. If they don't overlap, we keep them.
  for (let i = 0; i < attempts; i++) {
    let newC = createCircle();
    if (newC !== null) {
      circles.push(newC);
      // Stop if we have enough
      if (circles.length >= totalCircles) break;
    }
  }
}

function draw() {
  background(25); // Dark, deep background
  
  // Draw each circle
  for (let c of circles) {
    drawFlowInCircle(c);
  }
}

function createCircle() {
  // Pick a random spot
  let x = random(width);
  let y = random(height);
  
  // Start with a valid radius?
  let valid = true;
  let r = 0;
  
  // Check against all existing circles to find the closest neighbor
  // The distance to the nearest neighbor defines our maximum possible size
  let closestDist = Infinity;
  
  for (let c of circles) {
    let d = dist(x, y, c.x, c.y);
    // If we picked a spot INSIDE an existing circle, it's invalid immediately
    if (d < c.r + 2) { // +2 for padding
      valid = false;
      break;
    }
    // Calculate distance to the edge of that circle
    let distToEdge = d - c.r;
    if (distToEdge < closestDist) {
      closestDist = distToEdge;
    }
  }
  
  // Also check borders of canvas
  closestDist = min(closestDist, x);
  closestDist = min(closestDist, width - x);
  closestDist = min(closestDist, y);
  closestDist = min(closestDist, height - y);

  if (valid && closestDist > 5) { // Minimum radius of 5
    // We found a spot! The radius is the distance to the nearest obstacle
    // We impose a max radius so we don't get one giant circle taking up the whole screen
    return {
      x: x,
      y: y,
      r: min(closestDist - 2, width*.5) // -2 for padding, max size 150
    };
  } else {
    return null;
  }
}

function drawFlowInCircle(c) {
  // 1. VISUALIZE THE CONTAINER
  stroke(100, 100);
  strokeWeight(1);
  noFill();
  //ellipse(c.x, c.y, c.r * 2);
  
  // 2. CONFIGURE THE FLOW
  // Map noise scale to size:
  // Large circles (r=100) -> 0.005 (Smooth)
  // Small circles (r=5)   -> 0.08 (Chaotic)
  let noiseScale = map(c.r, 5, 100, 0.08, 0.005, true); 
  
  // Density: Bigger circles get more trails
  let area = PI * c.r * c.r;
  let numTrails = map(area, 0, 30000, 10, 300);
  
  let trailLength = 50;
  
  stroke(200, 220, 255, 60); // Ghostly blue trails
  strokeWeight(1);

  // 3. DRAW THE TRAILS
  for (let i = 0; i < numTrails; i++) {
    // Start anywhere inside the circle
    // We use polar coordinates to ensure we spawn uniformly inside
    let randAngle = random(TWO_PI);
    let randDist = random(c.r); // Simple linear random clusters at center slightly, which looks nice
    // For perfect uniform: sqrt(random()) * c.r
    
    let px = c.x + cos(randAngle) * randDist;
    let py = c.y + sin(randAngle) * randDist;
    
    beginShape();
    for (let j = 0; j < trailLength; j++) {
      vertex(px, py);
      
      // Calculate flow angle
      let angle = noise(px * noiseScale, py * noiseScale) * TWO_PI * 4;
      
      // Move particle
      px += cos(angle) * 2;
      py += sin(angle) * 2;
      
      // BOUNDARY CHECK: "Am I still inside the circle?"
      if (dist(px, py, c.x, c.y) > c.r) {
        break; // Stop drawing this trail if we hit the wall
      }
    }
    endShape();
  }
}

function mousePressed() {
  // Reset and redraw on click
  circles = [];
  setup();
  redraw();
}

function keyPressed() {
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('circleFlow_' + timeStamp);
    }
}