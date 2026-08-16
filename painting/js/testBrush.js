
function preload() {
  brush = loadImage('../common/brushes/Acrylic Glaze.png');
}

function setup() {
  createCanvas(800, 600);

  palette = getPalette("earthMagenta");

  background(getLightColor(palette));

}

function draw() {
  if (mouseIsPressed) {
    // angle towards mouse movement
    let angle = atan2(mouseY - pmouseY, mouseX - pmouseX);

    // brush, position, size, color, angle, transparency, count
    paintStroke(brush, mouseX, mouseY, 
      {size: 50, angle: angle, color: getAccentColor(palette), 
        alpha: 50, count: 5, spacing: 0.05, spread: 0.5, angleJitter: 0.5, forwardOnly: true});

    // Basic usage:
//
// paintStroke(brushImg, 400, 300, {
//   size: 180,
//   angle: radians(30),
//   color: "#202020",
//   alpha: 90
// });
  }
}
