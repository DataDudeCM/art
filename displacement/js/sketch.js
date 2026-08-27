let sourceImg = null;
let previewSourceImg = null;

let mapImg = null;
let scaledMap = null;

let displacedImg = null;

const PREVIEW_MAX_DIMENSION = 1200;

let showBefore = false;

let mode = "imageMap";
let flowSeed = 12345;
let renderMode = "pixel";
let brushType = "line";
let brushTipImg = null;

let radialCenterX = 0.5;
let radialCenterY = 0.5;

let showRadialCenterMarker = true;

let gpuPreview = null;
let flowShader = null;

let useShaderPreview = true;

let flowAnimating = true;
let flowTime = 0;
let flowSpeed = 1.0;

const PANEL_WIDTH = 320;

function preload() {
  flowShader = loadShader(
    "shaders/passthrough.vert",
    "shaders/flowField.frag"
  );
}

function setup() {
  const canvas = createCanvas(
    windowWidth - PANEL_WIDTH,
    windowHeight
  );

  canvas.position(0, 0);

  pixelDensity(1);

  noiseSeed(flowSeed);

  createUI();
}

function draw() {
  const palette =
    getPalette("industrialSun");

  background(
    getDarkColor(palette)
  );

  if (
    useShaderPreview &&
    mode === "flowField" &&
    renderMode === "pixel" &&
    flowAnimating
  ) {
    flowTime +=
      deltaTime * 0.001 * flowSpeed;
  }

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

  if (
    useShaderPreview &&
    mode === "flowField" &&
    renderMode === "pixel" &&
    !showBefore
  ) {
    renderShaderPreview();
    displayImage(gpuPreview);
  } else {
    const img =
      showBefore || !displacedImg
        ? previewSourceImg
        : displacedImg;

    displayImage(img);
  }
  if (
    mode === "radialField" &&
    sourceImg &&
    showRadialCenterMarker
  ) {
    drawRadialCenterMarker();
  }
}

function createGPUPreview() {
  if (gpuPreview) {
    gpuPreview.remove();
    gpuPreview = null;
  }

  if (!previewSourceImg) {
    return;
  }

  gpuPreview = createGraphics(
    previewSourceImg.width,
    previewSourceImg.height,
    WEBGL
  );

  gpuPreview.pixelDensity(1);
  gpuPreview.noStroke();
}

function createPreviewSource() {
  if (!sourceImg) {
    previewSourceImg = null;
    return;
  }

  previewSourceImg = sourceImg.get();

  const longestSide = max(
    previewSourceImg.width,
    previewSourceImg.height
  );

  if (
    longestSide <= PREVIEW_MAX_DIMENSION
  ) {
    return;
  }

  const scale =
    PREVIEW_MAX_DIMENSION /
    longestSide;

  previewSourceImg.resize(
    round(
      previewSourceImg.width *
      scale
    ),
    round(
      previewSourceImg.height *
      scale
    )
  );
}

function getRenderOptions(
  workingSource
) {
  if (
    renderMode !== "brush"
  ) {
    return {
      mode: "pixel"
    };
  }

  const resolutionScale =
    workingSource.width /
    previewSourceImg.width;

  return {
    mode: "brush",

    brush: {
      type: brushType,

      tipImage: brushTipImg,

      spacing:
        brushSpacingSlider.value() *
        resolutionScale,

      length:
        brushLengthSlider.value() *
        resolutionScale,

      thickness:
        brushThicknessSlider.value() *
        resolutionScale,

      opacity:
        brushOpacitySlider.value(),

      magnitudeResponse:
        brushMagnitudeSlider.value()
    }
  };
}

function handleBrushTipFile(file) {
  if (file.type !== "image") {
    console.log("Brush tip must be an image.");
    return;
  }

  loadImage(file.data, img => {
    brushTipImg = img;

    if (
      renderMode === "brush" &&
      brushType === "stamp"
    ) {
      tryRender();
    }
  });
}

function drawRadialCenterMarker() {
  const bounds = getDisplayBounds(previewSourceImg);

  const cx = bounds.x + bounds.w * radialCenterX;
  const cy = bounds.y + bounds.h * radialCenterY;

  const palette = getPalette("industrialSun");
  const warm = getColorByRole(palette, "warm", false);
  const light = getColorByRole(palette, "light", false);

  stroke(warm);
  strokeWeight(2);
  noFill();
  circle(cx, cy, 18);

  stroke(light);
  line(cx - 14, cy, cx + 14, cy);
  line(cx, cy - 14, cx, cy + 14);
}

function getDisplayBounds(img) {
  const margin = 32;

  const availableWidth = width - margin * 2;
  const availableHeight = height - margin * 2;

  let scaleFactor = min(
    availableWidth / img.width,
    availableHeight / img.height
  );

  scaleFactor = min(scaleFactor, 1);

  const displayWidth = img.width * scaleFactor;
  const displayHeight = img.height * scaleFactor;

  const x = (width - displayWidth) / 2;
  const y = (height - displayHeight) / 2;

  return {
    x,
    y,
    w: displayWidth,
    h: displayHeight
  };
}

function displayImage(img) {
  const bounds = getDisplayBounds(img);

  image(
    img,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h
  );
}

function handleSourceFile(file) {
  radialCenterX = 0.5;
  radialCenterY = 0.5;
  if (file.type !== "image") {
    console.log(
      "Source must be an image."
    );

    return;
  }

  loadImage(file.data, img => {
    sourceImg = img;
    createPreviewSource();
    createGPUPreview();

    displacedImg = null;
    scaledMap = null;

    updateSourceInfo();

    tryRender();
  });
}

function renderShaderPreview() {
  if (
    !gpuPreview ||
    !flowShader ||
    !previewSourceImg
  ) {
    return;
  }

  gpuPreview.shader(flowShader);

  flowShader.setUniform(
    "uTexture",
    previewSourceImg
  );

  flowShader.setUniform(
    "uResolution",
    [
      previewSourceImg.width,
      previewSourceImg.height
    ]
  );

  flowShader.setUniform(
    "uTime",
    flowTime
  );

  flowShader.setUniform(
    "uStrength",
    flowStrengthSlider.value()
  );

  flowShader.setUniform(
    "uNoiseScale",
    noiseScaleSlider.value()
  );

  flowShader.setUniform(
    "uAngleMult",
    angleSlider.value()
  );

  flowShader.setUniform(
    "uSeed",
    flowSeed
  );

  gpuPreview.rect(
    -gpuPreview.width / 2,
    -gpuPreview.height / 2,
    gpuPreview.width,
    gpuPreview.height
  );
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

function renderCurrentMode(
  workingSource
) {
  if (!workingSource || !sourceImg) {
    return null;
  }

  const renderScale =
    workingSource.width /
    sourceImg.width;

  if (mode === "imageMap") {
    return renderImageMap(
      workingSource,
      renderScale
    );
  }

  if (mode === "flowField") {
    return renderFlowField(
      workingSource,
      renderScale
    );
  }

  if (mode === "radialField") {
    return renderRadialField(
      workingSource,
      renderScale
    );
  }

  return null;
}

function tryRender() {
  if (!previewSourceImg) {
    return;
  }

  displacedImg =
    renderCurrentMode(
      previewSourceImg
    );
}

function renderImageMap(
  workingSource,
  renderScale
) {
  if (!workingSource || !mapImg) {
    return null;
  }

  scaledMap = mapImg.get();

  scaledMap.resize(
    workingSource.width,
    workingSource.height
  );

  scaledMap.loadPixels();

  const settings = {
    strengthX:
      strengthXSlider.value() *
      renderScale,

    strengthY:
      strengthYSlider.value() *
      renderScale
  };

  return renderDisplacementField(
    workingSource,

    (x, y, index) =>
      getImageMapOffset(
        x,
        y,
        index,
        settings
      ),

    getRenderOptions(
      workingSource
    )
  );
}

function renderFlowField(
  workingSource,
  renderScale
) {
  if (!workingSource) {
    return null;
  }

  noiseSeed(flowSeed);

  const settings = {
    strength:
      flowStrengthSlider.value() *
      renderScale,

    noiseScale:
      noiseScaleSlider.value() /
      renderScale,

    angleMult:
      angleSlider.value()
  };

  return renderDisplacementField(
    workingSource,

    (x, y, index) =>
      getFlowFieldOffset(
        x,
        y,
        index,
        settings
      ),

    getRenderOptions(
      workingSource
    )
  );
}

function renderRadialField(
  workingSource,
  renderScale
) {
  if (!workingSource) {
    return null;
  }

  const settings = {
    width:
      workingSource.width,

    height:
      workingSource.height,

    centerX:
      workingSource.width *
      radialCenterX,

    centerY:
      workingSource.height *
      radialCenterY,

    strength:
      radialStrengthSlider.value() *
      renderScale,

    radius:
      radialRadiusSlider.value(),

    falloff:
      radialFalloffSlider.value()
  };

  return renderDisplacementField(
    workingSource,

    (x, y, index) =>
      getRadialFieldOffset(
        x,
        y,
        index,
        settings
      ),

    getRenderOptions(
      workingSource
    )
  );
}

function randomizeFlowField() {
  flowSeed = floor(
    random(0, 1000000)
  );

  noiseSeed(flowSeed);

  if (mode === "flowField") {
    tryRender();
  }
}



function saveResult() {
  if (!sourceImg) {
    return;
  }

  const fullResolutionResult =
    renderCurrentMode(sourceImg);

  if (!fullResolutionResult) {
    return;
  }

  const timestamp =
    year() +
    nf(month(), 2) +
    nf(day(), 2) +
    "-" +
    nf(hour(), 2) +
    nf(minute(), 2) +
    nf(second(), 2);

  fullResolutionResult.save(
    `displacement-${mode}-${timestamp}`,
    "png"
  );
}

function mousePressed() {
  if (mode !== "radialField" || !sourceImg) {
    return;
  }

  const bounds = getDisplayBounds(previewSourceImg);

  const insideImage =
    mouseX >= bounds.x &&
    mouseX <= bounds.x + bounds.w &&
    mouseY >= bounds.y &&
    mouseY <= bounds.y + bounds.h;

  if (!insideImage) {
    return;
  }

  radialCenterX = constrain(
    (mouseX - bounds.x) / bounds.w,
    0,
    1
  );

  radialCenterY = constrain(
    (mouseY - bounds.y) / bounds.h,
    0,
    1
  );

  tryRender();
}

function keyPressed() {
  if (key === " ") {
    showBefore = !showBefore;

    updateBeforeAfterButton();

    return false;
  }
  if (key === "p" || key === "P") {
    flowAnimating = !flowAnimating;
  }
}

function windowResized() {
  resizeCanvas(
    windowWidth - PANEL_WIDTH,
    windowHeight
  );
}