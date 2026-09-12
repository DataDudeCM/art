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

function getFillSamplePoint() {
  if (SETTINGS.fill.sampleMode !== "centerWeighted") {
    return {
      x: random(width),
      y: random(height)
    };
  }

  const strength =
    constrain(
      SETTINGS.fill.centerWeight / 100,
      0,
      1
    );

  const baseSigma =
    min(width, height);

  const sigma = lerp(
    baseSigma * 0.35,
    baseSigma * 0.08,
    strength
  );

  return {
    x: constrain(
      randomGaussian(width / 2, sigma),
      0,
      width - 1
    ),
    y: constrain(
      randomGaussian(height / 2, sigma),
      0,
      height - 1
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