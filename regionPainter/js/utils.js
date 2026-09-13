function getRegionKey(region) {
  if (!region || !region.pixels || region.pixels.length === 0) {
    return null;
  }

  let minIndex = Infinity;

  for (const p of region.pixels) {
    const index = p.y * width + p.x;

    if (index < minIndex) {
      minIndex = index;
    }
  }

  return `${region.pixelCount}-${minIndex}`;
}

function getOrAssignRegionColor(region, colorMap, palette) {
  const key = getRegionKey(region);

  if (!key) {
    return randomColor(palette);
  }

  if (!colorMap.has(key)) {
    colorMap.set(
      key,
      randomColor(palette)
    );
  }

  return colorMap.get(key);
}

function getFillSamplePoint(
  viewport = getFullCanvasViewport()
) {
  if (SETTINGS.fill.sampleMode !== "centerWeighted") {
    return {
      x: random(
        viewport.x,
        viewport.x + viewport.width
      ),
      y: random(
        viewport.y,
        viewport.y + viewport.height
      )
    };
  }

  const strength =
    constrain(
      SETTINGS.fill.centerWeight / 100,
      0,
      1
    );

  const baseSigma =
    min(
      viewport.width,
      viewport.height
    );

  const sigma = lerp(
    baseSigma * 0.35,
    baseSigma * 0.08,
    strength
  );

  const centerX =
    viewport.x +
    viewport.width / 2;

  const centerY =
    viewport.y +
    viewport.height / 2;

  return {
    x: constrain(
      randomGaussian(
        centerX,
        sigma
      ),
      viewport.x,
      viewport.x +
        viewport.width -
        1
    ),

    y: constrain(
      randomGaussian(
        centerY,
        sigma
      ),
      viewport.y,
      viewport.y +
        viewport.height -
        1
    )
  };
}

function getRegionPaintColor(region, palette) {
  if (SETTINGS.fill.colorMode === "randomPerHit") {
    return randomColor(palette);
  }

  return getOrAssignRegionColor(
    region,
    generationRegionColors,
    palette
  );
}