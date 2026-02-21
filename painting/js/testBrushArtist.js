let myBrush;
let painter;
let selectedPalette;

let iterations = 200;

function preload() {
  // 1) Load your brush image (e.g., Acrylic Basic.png)
  myBrush = loadImage('../brushes/Watercolor 4.png'); // Watercolor 4.png is a good one for testing, but you can try others too!
  textureImg = loadImage('../images/canvasBoard.jpg'); // Example canvas texture
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Initialize the library
  painter = new BrushArtist(myBrush);
  selectedPalette = palettes[int(random(palettes.length))]; // Example: using the first palette
  // Optionally, you can set a background color from the palette
  background(selectedPalette[0]);
  frameRate(1);
  //noLoop();
}

function draw() {
  let shape = [];
  background(selectedPalette[0]);
  background(textureImg);
    // 1. Define a complex shape (a simple star-ish blob)
  for (let i = 0; i < 10; i++) {
    let angle = map(i, 0, 10, 0, TWO_PI);
    let r = random(100, 150);
    shape.push(createVector(width/2 + cos(angle) * r, height/2 + sin(angle) * r));
  }
  painter.refill(); // Reset brush pigment before filling the shape
  // 2. The Filling Logic
  for (let i = 0; i < iterations; i++) {
    let x = random(width);
    let y = random(height);
    lastx = pointFromAngle(x, y, 10, random(TWO_PI)).x;
    lasty = pointFromAngle(x, y, 10, random(TWO_PI)).y;

    if (isInside(x, y, shape)) {
      painter.paintStroke(x, y,  {
        px: lastx,
        py: lasty,
        strokeColor: color('#d84747'), // Using your Palette #1
        size: 20,
        opacity: 40,
        ghosting: 2
    });
    }
  }
/*
  if (mouseIsPressed) {
    // 2) Paint using the library variables
    painter.refill(); // Reset brush pigment before painting
    painter.paintStroke(mouseX, mouseY,  {
      px: pmouseX,
      py: pmouseY,
      strokeColor: color('#cacaca'), // Using your Palette #1
      size: 40,
      opacity: 20,
      ghosting: 3
    });
  }
    */
}

function mousePressed() {
  // 3) Refill pigment when starting a new stroke
  painter.refill();
}

// The Ray Casting Algorithm
function isInside(px, py, poly) {
  let collision = false;
  let next = 0;
  for (let current = 0; current < poly.length; current++) {
    next = current + 1;
    if (next == poly.length) next = 0;
    let vc = poly[current];
    let vn = poly[next];

    if (((vc.y >= py && vn.y < py) || (vc.y < py && vn.y >= py)) &&
         (px < (vn.x - vc.x) * (py - vc.y) / (vn.y - vc.y) + vc.x)) {
            collision = !collision;
    }
  }
  return collision;
}