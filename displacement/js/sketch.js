let sourceImg = null;
let mapImg = null;
let scaledMap = null;
let displacedImg = null;

let sourceInput;
let mapInput;

let modeSelect;

let strengthXSlider;
let strengthYSlider;

let flowStrengthSlider;
let noiseScaleSlider;
let angleSlider;

let showBefore = false;

let mode = "imageMap";

const UI_HEIGHT = 220;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // -----------------------
  // Source image
  // -----------------------

  createSpan("Source image:")
    .position(20, 18)
    .style("color", "white");

  sourceInput = createFileInput(handleSourceFile);
  sourceInput.position(120, 15);

  // -----------------------
  // Mode
  // -----------------------

  createSpan("Mode:")
    .position(20, 53)
    .style("color", "white");

  modeSelect = createSelect();
  modeSelect.position(120, 50);

  modeSelect.option("Image Map", "imageMap");
  modeSelect.option("Flow Field", "flowField");

  modeSelect.selected(mode);

  modeSelect.changed(() => {
    mode = modeSelect.value();

    updateControlVisibility();
    tryRender();
  });

  // -----------------------
  // Image map controls
  // -----------------------

  createSpan("Displacement:")
    .position(20, 88)
    .style("color", "white")
    .addClass("image-map-control");

  mapInput = createFileInput(handleMapFile);
  mapInput.position(120, 85);
  mapInput.addClass("image-map-control");

  createSpan("Horizontal:")
    .position(20, 123)
    .style("color", "white")
    .addClass("image-map-control");

  strengthXSlider = createSlider(0, 200, 30, 1);
  strengthXSlider.position(120, 119);
  strengthXSlider.size(220);
  strengthXSlider.addClass("image-map-control");

  strengthXSlider.input(() => {
    if (mode === "imageMap") {
      tryRender();
    }
  });

  createSpan("Vertical:")
    .position(20, 158)
    .style("color", "white")
    .addClass("image-map-control");

  strengthYSlider = createSlider(0, 200, 30, 1);
  strengthYSlider.position(120, 154);
  strengthYSlider.size(220);
  strengthYSlider.addClass("image-map-control");

  strengthYSlider.input(() => {
    if (mode === "imageMap") {
      tryRender();
    }
  });

  // -----------------------
  // Flow field controls
  // -----------------------

  createSpan("Strength:")
    .position(20, 88)
    .style("color", "white")
    .addClass("flow-field-control");

  flowStrengthSlider = createSlider(0, 200, 35, 1);
  flowStrengthSlider.position(120, 84);
  flowStrengthSlider.size(220);
  flowStrengthSlider.addClass("flow-field-control");

  flowStrengthSlider.input(() => {
    if (mode === "flowField") {
      tryRender();
    }
  });

  createSpan("Noise scale:")
    .position(20, 123)
    .style("color", "white")
    .addClass("flow-field-control");

  noiseScaleSlider = createSlider(
    0.001,
    0.05,
    0.008,
    0.001
  );

  noiseScaleSlider.position(120, 119);
  noiseScaleSlider.size(220);
  noiseScaleSlider.addClass("flow-field-control");

  noiseScaleSlider.input(() => {
    if (mode === "flowField") {
      tryRender();
    }
  });

  createSpan("Angle mult:")
    .position(20, 158)
    .style("color", "white")
    .addClass("flow-field-control");

  angleSlider = createSlider(1, 8, 2, 1);
  angleSlider.position(120, 154);
  angleSlider.size(220);
  angleSlider.addClass("flow-field-control");

  angleSlider.input(() => {
    if (mode === "flowField") {
      tryRender();
    }
  });

  noiseSeed(12345);

  updateControlVisibility();
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

function drawUI() {
  fill(255);
  noStroke();

  textAlign(LEFT, TOP);
  textSize(14);

  if (mode === "imageMap") {
    text(
      `X strength: ${strengthXSlider.value()}`,
      365,
      122
    );

    text(
      `Y strength: ${strengthYSlider.value()}`,
      365,
      157
    );
  }

  if (mode === "flowField") {
    text(
      `Strength: ${flowStrengthSlider.value()}`,
      365,
      87
    );

    text(
      `Noise scale: ${nf(
        noiseScaleSlider.value(),
        1,
        3
      )}`,
      365,
      122
    );

    text(
      `Angle mult: ${angleSlider.value()}`,
      365,
      157
    );
  }

  textSize(12);

  if (sourceImg) {
    text(
      `Source: ${sourceImg.width} × ${sourceImg.height}`,
      20,
      192
    );

    text(
      showBefore
        ? "SPACE: showing BEFORE"
        : "SPACE: showing AFTER",
      250,
      192
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

  sourceImg.loadPixels();
  scaledMap.loadPixels();

  displacedImg = createImage(
    sourceImg.width,
    sourceImg.height
  );

  displacedImg.loadPixels();

  const strengthX =
    strengthXSlider.value();

  const strengthY =
    strengthYSlider.value();

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {
      let i =
        4 * (x + y * sourceImg.width);

      let r =
        scaledMap.pixels[i];

      let g =
        scaledMap.pixels[i + 1];

      let normalizedX =
        (r - 128) / 127;

      let normalizedY =
        (g - 128) / 127;

      let dx =
        normalizedX * strengthX;

      let dy =
        normalizedY * strengthY;

      copySourcePixel(
        x,
        y,
        dx,
        dy,
        i
      );
    }
  }

  displacedImg.updatePixels();
}

function renderFlowField() {
  if (!sourceImg) {
    return;
  }

  const strength =
    flowStrengthSlider.value();

  const noiseScale =
    noiseScaleSlider.value();

  const angleMult =
    angleSlider.value();

  sourceImg.loadPixels();

  displacedImg = createImage(
    sourceImg.width,
    sourceImg.height
  );

  displacedImg.loadPixels();

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {
      let i =
        4 * (x + y * sourceImg.width);

      let n = noise(
        x * noiseScale,
        y * noiseScale
      );

      let angle =
        n * TWO_PI * angleMult;

      let dx =
        cos(angle) * strength;

      let dy =
        sin(angle) * strength;

      copySourcePixel(
        x,
        y,
        dx,
        dy,
        i
      );
    }
  }

  displacedImg.updatePixels();
}

function copySourcePixel(
  x,
  y,
  dx,
  dy,
  destinationIndex
) {
  let sx =
    floor(x + dx);

  let sy =
    floor(y + dy);

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

  displacedImg.pixels[destinationIndex] =
    sourceImg.pixels[sourceIndex];

  displacedImg.pixels[destinationIndex + 1] =
    sourceImg.pixels[sourceIndex + 1];

  displacedImg.pixels[destinationIndex + 2] =
    sourceImg.pixels[sourceIndex + 2];

  displacedImg.pixels[destinationIndex + 3] =
    sourceImg.pixels[sourceIndex + 3];
}

function updateControlVisibility() {
  const imageControls =
    selectAll(".image-map-control");

  const flowControls =
    selectAll(".flow-field-control");

  if (mode === "imageMap") {
    for (let control of imageControls) {
      control.show();
    }

    for (let control of flowControls) {
      control.hide();
    }
  } else {
    for (let control of imageControls) {
      control.hide();
    }

    for (let control of flowControls) {
      control.show();
    }
  }
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