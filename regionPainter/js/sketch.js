let palette;
let boundaryLayer;
let paintLayer;

function setup() {
  createCanvas(windowWidth, windowHeight);

  palette = getPalette("earthMagenta") || randomPalette();
  SETTINGS.canvas.paperColor = getLightColor(palette);

  boundaryLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);

  generateBoundary();

  noLoop();
}

function draw() {
  background(SETTINGS.canvas.paperColor);

  image(paintLayer, 0, 0);

  if (SETTINGS.boundary.visible) {
    image(boundaryLayer, 0, 0);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  boundaryLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);
  redraw();
}