let sourceImg = null;
let mapImg = null;
let scaledMap = null;
let displacedImg = null;

let showBefore = false;

let mode = "imageMap";

const PANEL_WIDTH = 320;

function setup() {
  const canvas = createCanvas(
    windowWidth - PANEL_WIDTH,
    windowHeight
  );

  canvas.position(0, 0);

  pixelDensity(1);

  noiseSeed(12345);

  createUI();
}

function draw() {
  const palette =
    getPalette("industrialSun");

  background(
    getDarkColor(palette)
  );

  if (!sourceImg) {
    fill(
      getColorByRole(
        palette,
        "neutral",
        false
      )
    );

    noStroke();

    textSize(16);
    textAlign(CENTER, CENTER);

    text(
      "Choose a source image",
      width / 2,
      height / 2
    );

    return;
  }

  const img =
    showBefore || !displacedImg
      ? sourceImg
      : displacedImg;

  displayImage(img);
}

function displayImage(img) {
  const margin = 32;

  const availableWidth =
    width - margin * 2;

  const availableHeight =
    height - margin * 2;

  let scaleFactor = min(
    availableWidth / img.width,
    availableHeight / img.height
  );

  // Never enlarge small images.
  scaleFactor = min(
    scaleFactor,
    1
  );

  const displayWidth =
    img.width * scaleFactor;

  const displayHeight =
    img.height * scaleFactor;

  const x =
    (width - displayWidth) / 2;

  const y =
    (height - displayHeight) / 2;

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
    console.log(
      "Source must be an image."
    );

    return;
  }

  loadImage(file.data, img => {
    sourceImg = img;

    displacedImg = null;
    scaledMap = null;

    updateSourceInfo();

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
    strengthX:
      strengthXSlider.value(),

    strengthY:
      strengthYSlider.value()
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
    strength:
      flowStrengthSlider.value(),

    noiseScale:
      noiseScaleSlider.value(),

    angleMult:
      angleSlider.value()
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

    updateBeforeAfterButton();

    return false;
  }
}

function windowResized() {
  resizeCanvas(
    windowWidth - PANEL_WIDTH,
    windowHeight
  );
}