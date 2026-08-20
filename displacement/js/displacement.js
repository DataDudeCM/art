let sourceImg = null;
let mapImg = null;
let scaledMap = null;
let displacedImg = null;

let sourceInput;
let mapInput;

let strengthXSlider;
let strengthYSlider;

let showBefore = false;

const UI_HEIGHT = 180;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // -----------------------
  // File inputs
  // -----------------------

  createSpan("Source image:")
    .position(20, 18)
    .style("color", "white");

  sourceInput = createFileInput(handleSourceFile);
  sourceInput.position(120, 15);

  createSpan("Displacement:")
    .position(20, 53)
    .style("color", "white");

  mapInput = createFileInput(handleMapFile);
  mapInput.position(120, 50);

  // -----------------------
  // X displacement
  // -----------------------

  createSpan("Horizontal:")
    .position(20, 92)
    .style("color", "white");

  strengthXSlider = createSlider(0, 200, 30, 1);
  strengthXSlider.position(120, 88);
  strengthXSlider.size(220);

  strengthXSlider.input(() => {
    if (displacedImg) {
      renderDisplacement();
    }
  });

  // -----------------------
  // Y displacement
  // -----------------------

  createSpan("Vertical:")
    .position(20, 127)
    .style("color", "white");

  strengthYSlider = createSlider(0, 200, 30, 1);
  strengthYSlider.position(120, 123);
  strengthYSlider.size(220);

  strengthYSlider.input(() => {
    if (displacedImg) {
      renderDisplacement();
    }
  });
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
      "Choose a source image and displacement map",
      width / 2,
      UI_HEIGHT + (height - UI_HEIGHT) / 2
    );

    return;
  }

  // If displacement hasn't been generated yet,
  // show the source image.
  let img =
    showBefore || !displacedImg
      ? sourceImg
      : displacedImg;

  displayImage(img);
}

function drawUI() {
  fill(255);
  noStroke();

  textAlign(LEFT, TOP);
  textSize(14);

  text(
    `X strength: ${strengthXSlider.value()}`,
    365,
    91
  );

  text(
    `Y strength: ${strengthYSlider.value()}`,
    365,
    126
  );

  textSize(12);

  if (sourceImg) {
    text(
      `Source: ${sourceImg.width} × ${sourceImg.height}`,
      20,
      158
    );
  }

  if (sourceImg && mapImg) {
    text(
      showBefore
        ? "SPACE: showing BEFORE"
        : "SPACE: showing AFTER",
      250,
      158
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

  // Small margin around the image
  scaleFactor *= 0.95;

  let displayWidth = img.width * scaleFactor;
  let displayHeight = img.height * scaleFactor;

  let x = (width - displayWidth) / 2;

  let y =
    UI_HEIGHT +
    (availableHeight - displayHeight) / 2;

  image(
    img,
    x,
    y,
    displayWidth,
    displayHeight
  );
}

function handleSourceFile(file) {
  if (file.type !== "image") {
    console.log("Source must be an image.");
    return;
  }

  loadImage(file.data, img => {
    sourceImg = img;

    // Old result is no longer valid
    displacedImg = null;
    scaledMap = null;

    tryRender();
  });
}

function handleMapFile(file) {
  if (file.type !== "image") {
    console.log("Displacement map must be an image.");
    return;
  }

  loadImage(file.data, img => {
    mapImg = img;

    displacedImg = null;
    scaledMap = null;

    tryRender();
  });
}

function tryRender() {
  if (!sourceImg || !mapImg) {
    return;
  }

  // Keep the originally loaded map untouched.
  scaledMap = mapImg.get();

  // Working copy matches source exactly.
  scaledMap.resize(
    sourceImg.width,
    sourceImg.height
  );

  sourceImg.loadPixels();
  scaledMap.loadPixels();

  displacedImg = createImage(
    sourceImg.width,
    sourceImg.height
  );

  renderDisplacement();
}

function renderDisplacement() {
  if (
    !sourceImg ||
    !scaledMap ||
    !displacedImg
  ) {
    return;
  }

  const strengthX = strengthXSlider.value();
  const strengthY = strengthYSlider.value();

  sourceImg.loadPixels();
  scaledMap.loadPixels();
  displacedImg.loadPixels();

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {

      let i =
        4 * (x + y * sourceImg.width);

      // Red controls horizontal displacement.
      // Green controls vertical displacement.
      let r = scaledMap.pixels[i];
      let g = scaledMap.pixels[i + 1];

      let normalizedX =
        (r - 128) / 127;

      let normalizedY =
        (g - 128) / 127;

      let dx =
        normalizedX * strengthX;

      let dy =
        normalizedY * strengthY;

      let sx = floor(x + dx);
      let sy = floor(y + dy);

      sx = constrain(
        sx,
        0,
        sourceImg.width - 1
      );

      sy = constrain(
        sy,
        0,
        sourceImg.height - 1
      );

      let sourceIndex =
        4 * (sx + sy * sourceImg.width);

      displacedImg.pixels[i] =
        sourceImg.pixels[sourceIndex];

      displacedImg.pixels[i + 1] =
        sourceImg.pixels[sourceIndex + 1];

      displacedImg.pixels[i + 2] =
        sourceImg.pixels[sourceIndex + 2];

      displacedImg.pixels[i + 3] =
        sourceImg.pixels[sourceIndex + 3];
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
  resizeCanvas(
    windowWidth,
    windowHeight
  );
}