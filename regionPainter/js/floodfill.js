function floodFillRegion(
  g,
  startX,
  startY,
  viewport = getFullCanvasViewport()
) {
  // Assumes g.loadPixels() has already been called
  // for the current boundary state.
  // //g.loadPixels();

  const w = g.width;
  const h = g.height;

  const sx = floor(startX);
  const sy = floor(startY);

  const minViewportX =
    floor(viewport.x);

  const maxViewportX =
    ceil(
      viewport.x +
      viewport.width
    ) - 1;

  const minViewportY =
    floor(viewport.y);

  const maxViewportY =
    ceil(
      viewport.y +
      viewport.height
    ) - 1;

  if (
    sx < minViewportX ||
    sx > maxViewportX ||
    sy < minViewportY ||
    sy > maxViewportY
  ) {
    return null;
  }

  if (isBoundaryPixel(g, sx, sy)) {
    return null;
  }

  const visited = new Uint8Array(w * h);
  const stack = [[sx, sy]];
  const pixels = [];

  let minX = sx;
  let maxX = sx;
  let minY = sy;
  let maxY = sy;

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (
      x < minViewportX ||
      x > maxViewportX ||
      y < minViewportY ||
      y > maxViewportY
    ) {
      continue;
    }

    const index = y * w + x;

    if (visited[index]) {
      continue;
    }

    visited[index] = 1;

    if (isBoundaryPixel(g, x, y)) {
      continue;
    }

    pixels.push({ x, y });

    minX = min(minX, x);
    maxX = max(maxX, x);
    minY = min(minY, y);
    maxY = max(maxY, y);

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  if (pixels.length < SETTINGS.fill.minRegionPixels) {
    return null;
  }

  const viewportPixels =
    viewport.width *
    viewport.height;

  const maxPixels =
    viewportPixels *
    SETTINGS.fill.maxRegionFraction;

  if (pixels.length > maxPixels) {
    return null;
  }

  return {
    pixels,
    pixelCount: pixels.length,

    bounds: {
      minX,
      minY,
      maxX,
      maxY
    }
  };
}

function isBoundaryPixel(g, x, y) {
  const index = 4 * (y * g.width + x);

  const r = g.pixels[index];
  const gg = g.pixels[index + 1];
  const b = g.pixels[index + 2];
  const a = g.pixels[index + 3];

  // boundaryLayer is transparent except for the black line,
  // so alpha is the most reliable test.
  return a > 20;
}