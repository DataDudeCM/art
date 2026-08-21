import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";


let faceLandmarker;

let sourceImage = null;
let detectionResult = null;

let fragments = {
  leftEye: null,
  rightEye: null,
  mouth: null
};

let statusText = "Loading MediaPipe...";

const FRAGMENT_PREVIEW_SCALE = 0.5;

// MediaPipe landmark indices for useful facial regions.

const LEFT_EYE = [
  33, 7, 163, 144, 145, 153, 154, 155,
  133, 173, 157, 158, 159, 160, 161, 246
];

const RIGHT_EYE = [
  362, 382, 381, 380, 374, 373, 390, 249,
  263, 466, 388, 387, 386, 385, 384, 398
];

const LEFT_EYEBROW = [
  70, 63, 105, 66, 107
];

const RIGHT_EYEBROW = [
  336, 296, 334, 293, 300
];

const NOSE = [
  168, 6, 197, 195, 5, 4, 1
];

const OUTER_LIPS = [
  61, 185, 40, 39, 37, 0,
  267, 269, 270, 409, 291,
  375, 321, 405, 314, 17,
  84, 181, 91, 146
];

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251,
  389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109
];


window.setup = async function () {

  createCanvas(windowWidth, windowHeight);

  textFont("Arial");

  createFileInput(handleFile)
    .position(20, 20)
    .attribute("accept", "image/*");

  await initializeFaceLandmarker();
};


window.draw = function () {

  background(30);

  fill(240);
  noStroke();
  textSize(16);
  text(statusText, 20, 75);

  if (!sourceImage) {
    return;
  }

  const panelWidth = 320;

  const fit = calculateImageFit(
    sourceImage.width,
    sourceImage.height,
    width - panelWidth,
    height
  );

  image(
    sourceImage,
    fit.x,
    fit.y,
    fit.w,
    fit.h
  );

  if (detectionResult) {
    drawLandmarks(
      detectionResult,
      fit
    );
    drawFragmentPanel();
  }
};


async function initializeFaceLandmarker() {

  try {

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker =
      await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU"
          },

          runningMode: "IMAGE",

          numFaces: 1,

          minFaceDetectionConfidence: 0.25,
          minFacePresenceConfidence: 0.25
        }
      );

    statusText =
      "MediaPipe ready. Load a portrait drawing.";

  }
  catch (err) {

    console.error(err);

    statusText =
      "Could not initialize MediaPipe. Check console.";

  }
}

function drawFragmentPanel() {

  const panelX =
    width - 300;

  const panelY =
    120;

  fill(240);
  noStroke();
  textSize(18);

  text(
    "Extracted Features",
    panelX,
    panelY
  );


  drawFragment(
    fragments.leftEye,
    "Left Eye",
    panelX,
    panelY + 40
  );

  drawFragment(
    fragments.rightEye,
    "Right Eye",
    panelX,
    panelY + 180
  );

  drawFragment(
    fragments.mouth,
    "Mouth",
    panelX,
    panelY + 320
  );
}

function drawFragment(
  fragment,
  label,
  x,
  y
) {

  fill(200);
  noStroke();
  textSize(14);

  text(label, x, y);

  if (!fragment) {
    return;
  }

  const displayW =
    fragment.width * FRAGMENT_PREVIEW_SCALE;

  const displayH =
    fragment.height * FRAGMENT_PREVIEW_SCALE;

  image(
    fragment,
    x,
    y + 10,
    displayW,
    displayH
  );
}

function handleFile(file) {

  if (file.type !== "image") {
    statusText = "Please choose an image file.";
    return;
  }

  statusText = "Loading drawing...";

  loadImage(
    file.data,

    img => {

      sourceImage = img;
      detectionResult = null;

      detectFace(file.data);

    },

    err => {

      console.error(err);
      statusText = "Could not load image.";

    }
  );
}


async function detectFace(dataUrl) {

  if (!faceLandmarker) {

    statusText =
      "MediaPipe is still loading.";

    return;
  }

  statusText =
    "Looking for a face...";

  const img = new Image();

  img.onload = async () => {

    try {

      detectionResult =
        faceLandmarker.detect(img);

      const count =
        detectionResult.faceLandmarks.length;

      if (count === 0) {

        statusText =
          "No face detected.";

      }
      else {

        statusText =
          `Face detected — ${count} face found.`;

        buildFragments();

      }

    }
    catch (err) {

      console.error(err);

      statusText =
        "Detection error. Check console.";

    }

  };

  img.src = dataUrl;
}

function buildFragments() {

  if (
    !sourceImage ||
    !detectionResult ||
    detectionResult.faceLandmarks.length === 0
  ) {
    return;
  }

  const landmarks =
    detectionResult.faceLandmarks[0];

  fragments.leftEye =
    extractFeature(
      landmarks,
      LEFT_EYE,
      {
        left: 0.45,
        right: 0.45,
        top: 0.5,
        bottom: 1
      }
    );

  fragments.rightEye =
    extractFeature(
      landmarks,
      RIGHT_EYE,
      {
        left: 0.45,
        right: 0.45,
        top: 0.5,
        bottom: 1
      }
    );

  fragments.mouth =
    extractFeature(
      landmarks,
      OUTER_LIPS,
      {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.35
      }
    );
}

function extractFeature(
  landmarks,
  indices,
  padding = {}
) {

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const padLeft   = padding.left   ?? 0.35;
  const padRight  = padding.right  ?? 0.35;
  const padTop    = padding.top    ?? 0.35;
  const padBottom = padding.bottom ?? 0.35;

  for (const index of indices) {

    const p = landmarks[index];

    const x =
      p.x * sourceImage.width;

    const y =
      p.y * sourceImage.height;

    minX = min(minX, x);
    minY = min(minY, y);
    maxX = max(maxX, x);
    maxY = max(maxY, y);
  }


  const featureWidth =
    maxX - minX;

  const featureHeight =
    maxY - minY;


  const leftPadding =
    featureWidth * padLeft;

  const rightPadding =
    featureWidth * padRight;

  const topPadding =
    featureHeight * padTop;

  const bottomPadding =
    featureHeight * padBottom;


  let cropX =
    floor(minX - leftPadding);

  let cropY =
    floor(minY - topPadding);

  let cropW =
    ceil(
      featureWidth +
      leftPadding +
      rightPadding
    );

  let cropH =
    ceil(
      featureHeight +
      topPadding +
      bottomPadding
    );


  // Keep crop within original image.

  cropX =
    constrain(
      cropX,
      0,
      sourceImage.width - 1
    );

  cropY =
    constrain(
      cropY,
      0,
      sourceImage.height - 1
    );

  cropW =
    min(
      cropW,
      sourceImage.width - cropX
    );

  cropH =
    min(
      cropH,
      sourceImage.height - cropY
    );


  const fragment =
    sourceImage.get(
      cropX,
      cropY,
      cropW,
      cropH
    );


  // Create transparency mask.

  const maskGraphics =
    createGraphics(
      cropW,
      cropH
    );

  maskGraphics.pixelDensity(1);

  maskGraphics.clear();   // fully transparent background

  maskGraphics.noStroke();
  maskGraphics.fill(255, 255);  // fully opaque feature region


  /*
   * For this first experiment we're using
   * a padded organic ellipse rather than the
   * exact landmark polygon.
   *
   * That deliberately preserves some nearby
   * pencil texture.
   */

  maskGraphics.ellipse(
    cropW / 2,
    cropH / 2,
    cropW * 0.92,
    cropH * 0.92
  );


  const maskImage =
    maskGraphics.get();

  fragment.mask(maskImage);

  maskGraphics.remove();

  return fragment;
}

function drawLandmarks(result, fit) {

  if (!result.faceLandmarks.length) {
    return;
  }

  const landmarks =
    result.faceLandmarks[0];


  // Face outline

  drawFeature(
    landmarks,
    FACE_OVAL,
    fit,
    color(255, 190, 60),
    true
  );


  // Eyes

  drawFeature(
    landmarks,
    LEFT_EYE,
    fit,
    color(40, 210, 255),
    true
  );

  drawFeature(
    landmarks,
    RIGHT_EYE,
    fit,
    color(40, 210, 255),
    true
  );


  // Eyebrows

  drawFeature(
    landmarks,
    LEFT_EYEBROW,
    fit,
    color(80, 255, 120),
    false
  );

  drawFeature(
    landmarks,
    RIGHT_EYEBROW,
    fit,
    color(80, 255, 120),
    false
  );


  // Nose

  drawFeature(
    landmarks,
    NOSE,
    fit,
    color(255, 90, 90),
    false
  );


  // Mouth

  drawFeature(
    landmarks,
    OUTER_LIPS,
    fit,
    color(255, 80, 220),
    true
  );

}


function drawFeature(
  landmarks,
  indices,
  fit,
  c,
  closed
) {

  noFill();

  stroke(c);
  strokeWeight(3);

  beginShape();

  for (const index of indices) {

    const p =
      landmarks[index];

    const x =
      fit.x +
      p.x * fit.w;

    const y =
      fit.y +
      p.y * fit.h;

    vertex(x, y);

  }

  if (closed) {
    endShape(CLOSE);
  }
  else {
    endShape();
  }


  // Draw the actual landmark points too.

  noStroke();
  fill(c);

  for (const index of indices) {

    const p =
      landmarks[index];

    circle(
      fit.x + p.x * fit.w,
      fit.y + p.y * fit.h,
      5
    );

  }

}


function calculateImageFit(
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight
) {

  const margin = 80;

  const availableWidth =
    containerWidth - margin * 2;

  const availableHeight =
    containerHeight - margin * 2;


  const scale = min(
    availableWidth / imageWidth,
    availableHeight / imageHeight
  );


  const w =
    imageWidth * scale;

  const h =
    imageHeight * scale;


  return {

    x:
      (containerWidth - w) / 2,

    y:
      (containerHeight - h) / 2,

    w,
    h

  };
}


window.windowResized = function () {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

};