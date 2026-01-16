
function preload() {
  brush = loadImage('../brushes/Acrylic Glaze.png');
}

function setup() {
  createCanvas(800, 600);
  background(240);
  palette = palettes[1];  // pick a palette from palettes.js
}

function draw() {
  if (mouseIsPressed) {
    // angle towards mouse movement
    let angle = atan2(mouseY - pmouseY, mouseX - pmouseX);

    // brush, position, size, color, angle, transparency, count
    paintStroke(brush, mouseX, mouseY, 20, angle, color('Black'), 50, 5);
  }
}
