import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";


let faceLandmarker;

let sourceImage = null;
let detectionResult = null;

let statusText = "Loading MediaPipe...";


// MediaPipe landmark indices for useful facial regions.

const LEFT_EYE = [
  33, 160, 158, 133, 153, 144
];

const RIGHT_EYE = [
  362, 385, 387, 263, 373, 380
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

  const fit = calculateImageFit(
    sourceImage.width,
    sourceImage.height,
    width,
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