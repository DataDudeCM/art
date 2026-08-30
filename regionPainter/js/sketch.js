let palette;
let boundaryLayer;
let paintLayer;

function setup() {
  createCanvas(windowWidth, windowHeight);

  //palette = getPalette("earthMagenta") || randomPalette();
  palette = randomPalette();
  SETTINGS.canvas.paperColor = getLightColor(palette);

  boundaryLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);

  generateBoundary();

  for (let i = 0; i < 20; i++) {
    testRegion();
  }

  noLoop();

  }

function draw() {
  background(SETTINGS.canvas.paperColor);

  image(paintLayer, 0, 0);

  if (SETTINGS.boundary.visible) {
    image(boundaryLayer, 0, 0);
  }
}

function testRegion() {
  const x = random(width);
  const y = random(height);

  const region = floodFillRegion(boundaryLayer, x, y);

  if (!region) {
    console.log("No valid region found");
    return;
  }

  console.log(
    `Region found: ${region.pixelCount} pixels`,
    region.bounds
  );

  //const regionColor = getAccentColor(palette) || randomColor(palette);
  const regionColor = randomColor(palette);
  paintRegion(region, paintLayer, regionColor);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  boundaryLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);
  redraw();
}