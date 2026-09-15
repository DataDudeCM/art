let regionCacheLookup = null;
let regionCacheRegions = [null];

function resetRegionCache() {
  regionCacheLookup =
    new Uint32Array(width * height);

  // Index 0 means "not cached".
  regionCacheRegions = [null];
}

function ensureRegionCache() {
  if (
    !regionCacheLookup ||
    regionCacheLookup.length !== width * height
  ) {
    resetRegionCache();
  }
}

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

  ensureRegionCache();

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

  const startIndex =
    sy * w + sx;

  const cachedRegionId =
    regionCacheLookup[startIndex];

  if (cachedRegionId !== 0) {
    return regionCacheRegions[
      cachedRegionId
    ];
  }

  if (isBoundaryPixel(g, sx, sy)) {
    return null;
  }

  const visited =
    new Uint8Array(w * h);

  const stack = [
    sy * w + sx
  ];

  const pixels = [];

  let minX = sx;
  let maxX = sx;
  let minY = sy;
  let maxY = sy;

  while (stack.length > 0) {
    const index =
      stack.pop();

    const x =
      index % w;

    const y =
      Math.floor(index / w);

    if (
      x < minViewportX ||
      x > maxViewportX ||
      y < minViewportY ||
      y > maxViewportY
    ) {
      continue;
    }

    if (visited[index]) {
      continue;
    }

    // 1 = visited but not part of this region
    visited[index] = 1;

    if (isBoundaryPixel(g, x, y)) {
      continue;
    }

    // 2 = confirmed member of this region
    visited[index] = 2;

    pixels.push({ x, y });

    minX = min(minX, x);
    maxX = max(maxX, x);
    minY = min(minY, y);
    maxY = max(maxY, y);

    if (x < maxViewportX) {
      stack.push(index + 1);
    }

    if (x > minViewportX) {
      stack.push(index - 1);
    }

    if (y < maxViewportY) {
      stack.push(index + w);
    }

    if (y > minViewportY) {
      stack.push(index - w);
    }
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

  const edgePixels = [];

  for (const p of pixels) {
    const x = p.x;
    const y = p.y;

    const left =
      x > minViewportX
        ? y * w + (x - 1)
        : -1;

    const right =
      x < maxViewportX
        ? y * w + (x + 1)
        : -1;

    const up =
      y > minViewportY
        ? (y - 1) * w + x
        : -1;

    const down =
      y < maxViewportY
        ? (y + 1) * w + x
        : -1;

    if (
      left === -1 ||
      right === -1 ||
      up === -1 ||
      down === -1 ||
      visited[left] !== 2 ||
      visited[right] !== 2 ||
      visited[up] !== 2 ||
      visited[down] !== 2
    ) {
      edgePixels.push(p);
    }
  }

  const region = {
    pixels,
    edgePixels,
    pixelCount: pixels.length,

    bounds: {
      minX,
      minY,
      maxX,
      maxY
    }
  };

  const regionId =
    regionCacheRegions.length;

  regionCacheRegions.push(region);

  for (const p of pixels) {
    const index =
      p.y * w + p.x;

    regionCacheLookup[index] =
      regionId;
  }

  return region;
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