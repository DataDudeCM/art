let sourceImg = null;
let displacedImg = null;

let sourceInput;

let strengthSlider;
let scaleSlider;
let angleSlider;

let showBefore = false;

const UI_HEIGHT = 170;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  createSpan("Source image:")
    .position(20, 18)
    .style("color", "white");

  sourceInput = createFileInput(handleSourceFile);
  sourceInput.position(120, 15);

  createSpan("Strength:")
    .position(20, 58)
    .style("color", "white");

  strengthSlider = createSlider(0, 200, 35, 1);
  strengthSlider.position(120, 55);
  strengthSlider.size(220);
  strengthSlider.input(() => {
    if (sourceImg) renderDisplacement();
  });

  createSpan("Noise scale:")
    .position(20, 93)
    .style("color", "white");

  scaleSlider = createSlider(0.001, 0.05, 0.008, 0.001);
  scaleSlider.position(120, 90);
  scaleSlider.size(220);
  scaleSlider.input(() => {
    if (sourceImg) renderDisplacement();
  });

  createSpan("Angle mult:")
    .position(20, 128)
    .style("color", "white");

  angleSlider = createSlider(1, 8, 2, 1);
  angleSlider.position(120, 125);
  angleSlider.size(220);
  angleSlider.input(() => {
    if (sourceImg) renderDisplacement();
  });

  noiseSeed(12345);
}

function draw() {
  background(30);

  drawUI();

  if (!sourceImg) {
    fill(180);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);

    text(
      "Choose a source image",
      width / 2,
      UI_HEIGHT + (height - UI_HEIGHT) / 2
    );
    return;
  }

  let img = showBefore || !displacedImg ? sourceImg : displacedImg;
  displayImage(img);
}

function drawUI() {
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);

  text(`Strength: ${strengthSlider.value()}`, 365, 58);
  text(`Noise scale: ${nf(scaleSlider.value(), 1, 3)}`, 365, 93);
  text(`Angle mult: ${angleSlider.value()}`, 365, 128);

  textSize(12);

  if (sourceImg) {
    text(`Source: ${sourceImg.width} × ${sourceImg.height}`, 20, 152);
    text(
      showBefore ? "SPACE: showing BEFORE" : "SPACE: showing AFTER",
      220,
      152
    );
  }
}

function displayImage(img) {
  let availableWidth = width;
  let availableHeight = height - UI_HEIGHT;

  let scaleFactor = min(
    availableWidth / img.width,
    availableHeight / img.height
  );

  scaleFactor *= 0.95;

  let displayWidth = img.width * scaleFactor;
  let displayHeight = img.height * scaleFactor;

  let x = (width - displayWidth) / 2;
  let y = UI_HEIGHT + (availableHeight - displayHeight) / 2;

  image(img, x, y, displayWidth, displayHeight);
}

function handleSourceFile(file) {
  if (file.type !== "image") {
    console.log("Source must be an image.");
    return;
  }

  loadImage(file.data, img => {
    sourceImg = img;
    displacedImg = null;
    renderDisplacement();
  });
}

function renderDisplacement() {
  if (!sourceImg) return;

  let strength = strengthSlider.value();
  let noiseScale = scaleSlider.value();
  let angleMult = angleSlider.value();

  sourceImg.loadPixels();

  displacedImg = createImage(sourceImg.width, sourceImg.height);
  displacedImg.loadPixels();

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {
      let i = 4 * (x + y * sourceImg.width);

      // Noise-driven flow field
      let n = noise(x * noiseScale, y * noiseScale);

      // Convert noise value into an angle
      let angle = n * TWO_PI * angleMult;

      let dx = cos(angle) * strength;
      let dy = sin(angle) * strength;

      let sx = floor(x + dx);
      let sy = floor(y + dy);

      sx = constrain(sx, 0, sourceImg.width - 1);
      sy = constrain(sy, 0, sourceImg.height - 1);

      let sourceIndex = 4 * (sx + sy * sourceImg.width);

      displacedImg.pixels[i]     = sourceImg.pixels[sourceIndex];
      displacedImg.pixels[i + 1] = sourceImg.pixels[sourceIndex + 1];
      displacedImg.pixels[i + 2] = sourceImg.pixels[sourceIndex + 2];
      displacedImg.pixels[i + 3] = sourceImg.pixels[sourceIndex + 3];
    }
  }

  displacedImg.updatePixels();
}

function keyPressed() {
  if (key === " ") {
    showBefore = !showBefore;
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}