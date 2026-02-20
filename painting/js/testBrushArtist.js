let myBrush;
let painter;

function preload() {
  // 1) Load your brush image (e.g., Acrylic Basic.png)
  myBrush = loadImage('../brushes/Creamy.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
  // Initialize the library
  painter = new BrushArtist(myBrush);
}

function draw() {
  if (mouseIsPressed) {
    // 2) Paint using the library variables
    painter.paintStroke(mouseX, mouseY, pmouseX, pmouseY, {
      strokeColor: color('#000000'), // Using your Palette #1
      size: 40,
      opacity: 20,
      ghosting: 3
    });
  }
}

function mousePressed() {
  // 3) Refill pigment when starting a new stroke
  painter.refill();
}