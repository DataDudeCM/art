
function preload() {
  // 1) Load your brush image (e.g., Acrylic Basic.png)
  myBrush = loadImage('../brushes/Creamy.png');
}
function setup() {
  createCanvas(600, 400);
  background(255); // White background
  strokeWeight(2);
  frameRate(10);
      // Initialize the library
  painter = new BrushArtist(myBrush);
  //noLoop(); // Only draw once
}

function draw() {
  // Draw a sketchy line from (50, 200) to (550, 200)
  sketchyPaintedLine(random(0, width), random(0, height), random(0, width), random(0, height));
}
