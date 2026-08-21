let sourceImg = null;
let mapImg = null;
let scaledMap = null;
let displacedImg = null;

let showBefore = false;

let mode = "imageMap";

const UI_HEIGHT = 220;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  noiseSeed(12345);

  createUI();
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

  let img =
    showBefore || !displacedImg
      ? sourceImg
      : displacedImg;

  displayImage(img);
}

function displayImage(img) {
  let availableWidth = width;
  let availableHeight = height - UI_HEIGHT;

  let scaleFactor = min(
    availableWidth / img.width,
    availableHeight / img.height
  );

  scaleFactor *= 0.95;

  let displayWidth =
    img.width * scaleFactor;

  let displayHeight =
    img.height * scaleFactor;

  let x =
    (width - displayWidth) / 2;

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

    displacedImg = null;
    scaledMap = null;

    tryRender();
  });
}

function handleMapFile(file) {
  if (file.type !== "image") {
    console.log(
      "Displacement map must be an image."
    );
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
  if (!sourceImg) {
    return;
  }

  if (mode === "imageMap") {
    renderImageMap();
  }

  if (mode === "flowField") {
    renderFlowField();
  }
}

function renderImageMap() {
  if (!sourceImg || !mapImg) {
    displacedImg = null;
    return;
  }

  scaledMap = mapImg.get();

  scaledMap.resize(
    sourceImg.width,
    sourceImg.height
  );

  scaledMap.loadPixels();

  const settings = {
    strengthX: strengthXSlider.value(),
    strengthY: strengthYSlider.value()
  };

  renderDisplacementField(
    (x, y, index) =>
      getImageMapOffset(
        x,
        y,
        index,
        settings
      )
  );
}

function renderFlowField() {
  if (!sourceImg) {
    return;
  }

  const settings = {
    strength: flowStrengthSlider.value(),
    noiseScale: noiseScaleSlider.value(),
    angleMult: angleSlider.value()
  };

  renderDisplacementField(
    (x, y, index) =>
      getFlowFieldOffset(
        x,
        y,
        index,
        settings
      )
  );
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