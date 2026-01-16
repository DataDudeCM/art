function setup() {
    createCanvas(800, 800);
    background(255);
    stroke(0, 50); // Black with low opacity for overlapping effect
    noFill();
    
    // Start the fractal
    drawFractal(width / 2, height / 2, 400, 4);
  }
  
  function drawFractal(x, y, size, depth) {
    if (depth <= 0) return; // Base case: stop recursion
    
    // Draw a sketchy circle using multiple overlapping ellipses
    sketchyEllipse(x, y, size);
    
    // Recursive calls for smaller circles
    let newSize = size * 0.5;
    drawFractal(x - size / 2, y, newSize, depth - 1); // Left
    drawFractal(x + size / 2, y, newSize, depth - 1); // Right
    drawFractal(x, y - size / 2, newSize, depth - 1); // Top
    drawFractal(x, y + size / 2, newSize, depth - 1); // Bottom
  }
  
  function sketchyEllipse(x, y, d) {
    let layers = 8; // Number of overlapping ellipses
    let wobble = 3; // Amount of randomness for each ellipse
    
    for (let i = 0; i < layers; i++) {
      beginShape();
      for (let angle = 0; angle < TWO_PI; angle += 0.3) {
        let px = x + cos(angle) * (d / 2 + random(-wobble, wobble));
        let py = y + sin(angle) * (d / 2 + random(-wobble, wobble));
        vertex(px, py);
      }
      endShape(CLOSE);
    }
  }
  
  
