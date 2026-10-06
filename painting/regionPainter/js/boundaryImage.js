// Uploaded boundary image (boundary source "image").
//
// A black-and-white drawing becomes boundary walls: it is fitted into
// the viewport (scaled by boundary.scale), thresholded so dark pixels
// are walls, and the walls are thickened to close small gaps. The wall
// mask is written straight into boundaryDetectionLayer, so flood fill
// and painting work unchanged. See "Boundary Image Import" in DESIGN.md.

let uploadedBoundaryImage = null;
let uploadedBoundaryImageName = null;

// Processed masks, keyed by image version, viewport, scale and settings,
// so regenerating with a new seed doesn't reprocess the image.
let boundaryImageVersion = 0;
let boundaryImageMaskCache = new Map();

// Width of the soft edge on visible lines, in brightness levels.
const BOUNDARY_IMAGE_EDGE_SOFTNESS = 24;

function loadBoundaryImageFile(file) {
  if (!file) {
    return;
  }

  const objectURL =
    URL.createObjectURL(file);

  loadImage(
    objectURL,

    img => {
      uploadedBoundaryImage = img;
      uploadedBoundaryImageName = file.name;

      boundaryImageVersion++;
      boundaryImageMaskCache = new Map();

      URL.revokeObjectURL(objectURL);

      updateBoundaryImageDisplay();

      if (SETTINGS.boundary.source === "image") {
        requestGenerate();
      }
    },

    error => {
      URL.revokeObjectURL(objectURL);

      console.error(
        "Could not load boundary image:",
        error
      );
    }
  );
}

function updateBoundaryImageDisplay() {
  const display =
    document.getElementById(
      "boundary-image-file-name"
    );

  if (!display) {
    return;
  }

  display.textContent =
    uploadedBoundaryImageName ||
    "No image selected";
}

function createImageBoundarySource() {
  return {
    type: "image",

    generate() {
      // No strokes: the image is applied as a pixel mask by
      // applyBoundaryImage(). An empty strokes array also tells the
      // animation to finalize this cell's boundary in one step.
      return {
        type: "image",
        strokes: []
      };
    }
  };
}

// Writes the image's walls into the detection layer and, when the
// boundary is visible, its lines into the visible boundary layer.
// Returns false if no image has been uploaded.
function applyBoundaryImage(viewport) {
  if (!uploadedBoundaryImage) {
    return false;
  }

  const mask =
    getBoundaryImageMask(viewport);

  writeBoundaryImageWalls(mask);
  drawBoundaryImageLines(mask);

  return true;
}

function getBoundaryImageMask(viewport) {
  const settings =
    SETTINGS.boundary.image;

  // Integer pixel bounds of the viewport, inside the canvas.
  const x0 = max(0, floor(viewport.x));
  const y0 = max(0, floor(viewport.y));
  const x1 = min(width, ceil(viewport.x + viewport.width));
  const y1 = min(height, ceil(viewport.y + viewport.height));
  const w = x1 - x0;
  const h = y1 - y0;

  // Fit the whole image in the viewport ("contain"), then apply
  // boundary.scale. Above 1.0 the image extends past the viewport
  // and is cropped; it always stays centred.
  const img = uploadedBoundaryImage;

  const fit =
    min(
      viewport.width / img.width,
      viewport.height / img.height
    ) * SETTINGS.boundary.scale;

  const drawW = img.width * fit;
  const drawH = img.height * fit;
  const drawX = viewport.x + (viewport.width - drawW) / 2 - x0;
  const drawY = viewport.y + (viewport.height - drawH) / 2 - y0;

  const key = [
    boundaryImageVersion,
    x0, y0, w, h,
    drawX.toFixed(2), drawY.toFixed(2), drawW.toFixed(2),
    settings.threshold,
    settings.thicken,
    settings.invert
  ].join("|");

  const cached =
    boundaryImageMaskCache.get(key);

  if (cached) {
    return cached;
  }

  const g =
    createGraphics(w, h);

  g.pixelDensity(1);
  g.clear();
  g.image(img, drawX, drawY, drawW, drawH);
  g.loadPixels();

  const walls = new Uint8Array(w * h);
  const lineAlpha = new Uint8ClampedArray(w * h);

  for (let i = 0; i < w * h; i++) {
    const r = g.pixels[i * 4];
    const gr = g.pixels[i * 4 + 1];
    const b = g.pixels[i * 4 + 2];
    const a = g.pixels[i * 4 + 3];

    let brightness =
      0.299 * r + 0.587 * gr + 0.114 * b;

    if (settings.invert) {
      brightness = 255 - brightness;
    }

    // Transparent pixels (and margins outside the image) are never walls.
    walls[i] =
      a >= 128 && brightness < settings.threshold
        ? 1
        : 0;

    // Visible lines get a slightly soft edge around the threshold,
    // so they don't look jagged.
    const coverage =
      constrain(
        (settings.threshold - brightness) /
          BOUNDARY_IMAGE_EDGE_SOFTNESS +
          0.5,
        0,
        1
      );

    lineAlpha[i] = coverage * a;
  }

  g.remove();

  const mask = {
    x: x0,
    y: y0,
    width: w,
    height: h,
    walls: thickenWalls(walls, w, h, settings.thicken),
    lineAlpha
  };

  boundaryImageMaskCache.set(key, mask);

  return mask;
}

// Grows walls by `radius` pixels in every direction (a square
// dilation), done as a horizontal pass then a vertical pass.
function thickenWalls(walls, w, h, radius) {
  if (radius <= 0) {
    return walls;
  }

  const horizontal = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    dilateLine(walls, horizontal, y * w, 1, w, radius);
  }

  const result = new Uint8Array(w * h);

  for (let x = 0; x < w; x++) {
    dilateLine(horizontal, result, x, w, h, radius);
  }

  return result;
}

// Dilates one row or column: `start` is its first index, `step` the
// distance between neighbours, `length` its number of pixels.
function dilateLine(source, target, start, step, length, radius) {
  // Count of wall pixels inside the sliding window [i - radius, i + radius].
  let count = 0;

  for (let i = 0; i < min(radius, length); i++) {
    count += source[start + i * step];
  }

  for (let i = 0; i < length; i++) {
    const enter = i + radius;
    const leave = i - radius - 1;

    if (enter < length) {
      count += source[start + enter * step];
    }

    if (leave >= 0) {
      count -= source[start + leave * step];
    }

    target[start + i * step] =
      count > 0 ? 1 : 0;
  }
}

function writeBoundaryImageWalls(mask) {
  const layer =
    boundaryDetectionLayer;

  layer.loadPixels();

  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!mask.walls[y * mask.width + x]) {
        continue;
      }

      const p =
        4 * ((mask.y + y) * layer.width + mask.x + x);

      layer.pixels[p] = 0;
      layer.pixels[p + 1] = 0;
      layer.pixels[p + 2] = 0;
      layer.pixels[p + 3] = 255;
    }
  }

  layer.updatePixels();
}

function drawBoundaryImageLines(mask) {
  // Visible lines use the original drawing, not the thickened walls,
  // in the generation's boundary colour.
  const lines =
    createImage(mask.width, mask.height);

  const lineColor =
    generationBoundaryColor || color(0);

  const r = red(lineColor);
  const g = green(lineColor);
  const b = blue(lineColor);

  lines.loadPixels();

  for (let i = 0; i < mask.width * mask.height; i++) {
    lines.pixels[i * 4] = r;
    lines.pixels[i * 4 + 1] = g;
    lines.pixels[i * 4 + 2] = b;
    lines.pixels[i * 4 + 3] = mask.lineAlpha[i];
  }

  lines.updatePixels();

  boundaryLayer.image(lines, mask.x, mask.y);
}
