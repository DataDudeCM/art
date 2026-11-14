// Finds a face in a photo and returns the few points the facets
// are built from. Coordinates are in photo pixels.

import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/" +
  "face_landmarker/float16/1/face_landmarker.task";

let landmarker = null;

export async function initFace() {
  const vision = await FilesetResolver.forVisionTasks(WASM);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "IMAGE",
    numFaces: 1,
    minFaceDetectionConfidence: 0.25,
    minFacePresenceConfidence: 0.25
  });
}

// All 478 landmarks as {x, y} in photo pixels, or null if no face.
export function detectLandmarks(img) {
  const result = landmarker.detect(img);
  if (!result.faceLandmarks.length) return null;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  return result.faceLandmarks[0].map(p => ({ x: p.x * w, y: p.y * h }));
}

// --- The hand-picked points ------------------------------------
// MediaPipe landmark numbers. "L" is the left side of the picture.

// Inside the face.
const INNER = [
  151, 9, 168, 4, 2, 0, 17,   // midline: forehead, brow, nasion, nose tip, under nose, top of lip, under lip
  67, 10, 297,                // hairline
  69, 299,                    // forehead, above each brow
  70, 107, 336, 300,          // brow ends: L outer, L inner, R inner, R outer
  33, 133, 362, 263,          // eye corners: L outer, L inner, R inner, R outer
  159, 145, 386, 374,         // eyelids: L top, L bottom, R top, R bottom
  50, 280,                    // cheekbones
  205, 425,                   // lower cheeks
  129, 358,                   // nose wings
  61, 291                     // mouth corners
];

// The outline, clockwise from the left ear. Entries marked crown
// are pushed outward from the face to stand in for the skull,
// because MediaPipe stops at the hairline.
const OUTLINE = [
  { i: 234 },
  { i: 162, crown: true },
  { i: 54, crown: true },
  { i: 67, crown: true },
  { i: 10, crown: true },
  { i: 297, crown: true },
  { i: 284, crown: true },
  { i: 389, crown: true },
  { i: 454 },
  { i: 397 },
  { i: 378 },
  { i: 152 },
  { i: 149 },
  { i: 172 }
];

// Features that stay recognisable. Their triangles are kept out of
// the plane merging, so facet edges go around them, not through them.
const FEATURES = {
  leftEye: [33, 159, 133, 145],
  rightEye: [362, 386, 263, 374],
  nose: [168, 129, 4, 358, 2],
  mouth: [61, 0, 291, 17]
};

const CROWN_LIFT = 0.95;   // how far the top of the skull rises past the hairline
const CROWN_WIDEN = 0.06;  // a little extra width for hair at the sides

// Returns { points: [{x, y, id}], outline: [index into points],
//           features: { name: [index into points] } }.
export function keyPoints(lm, imgW, imgH) {
  const centre = lm[168];
  const up = unit(lm[10].x - lm[152].x, lm[10].y - lm[152].y);

  const points = [];
  const outline = [];

  for (const o of OUTLINE) {
    let p = lm[o.i];
    if (o.crown) {
      const dx = p.x - centre.x;
      const dy = p.y - centre.y;
      const d = unit(dx, dy);
      const upness = Math.max(0, d.x * up.x + d.y * up.y);
      const k = CROWN_WIDEN + CROWN_LIFT * Math.pow(upness, 1.5);
      p = { x: p.x + dx * k, y: p.y + dy * k };
    }
    outline.push(points.length);
    points.push({
      x: clamp(p.x, 2, imgW - 2),
      y: clamp(p.y, 2, imgH - 2),
      id: (o.crown ? "c" : "") + o.i
    });
  }

  for (const i of INNER) {
    points.push({ x: lm[i].x, y: lm[i].y, id: String(i) });
  }

  const features = {};
  for (const [name, ids] of Object.entries(FEATURES)) {
    features[name] = ids.map(i => points.findIndex(p => p.id === String(i)));
  }

  return { points, outline, features };
}

function unit(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
