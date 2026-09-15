function resolveRegionEvent(
  region,
  targetLayer,
  regionColor
) {
  // First pass:
  // if artifacts are enabled and eligible, place one.
  // Otherwise paint normally.
  if (maybePlaceTextArtifact(region, targetLayer)) {
    return "artifact";
  }

  paintRegion(region, targetLayer, regionColor);
  return "paint";
}

function maybePlaceTextArtifact(region, targetLayer) {
  if (!SETTINGS.artifact.enabled) {
    return false;
  }

  if (!artifactEntries.length) {
    return false;
  }

  if (
    !region ||
    region.pixelCount < SETTINGS.artifact.minRegionPixels
  ) {
    return false;
  }

  const regionKey = getRegionKey(region);

  if (!regionKey) {
    return false;
  }

  // Once a region has received an artifact,
  // all future hits paint normally.
  if (generationRegionArtifacts.has(regionKey)) {
    return false;
  }

  // Any hit can become the artifact hit.
  // Failed rolls simply paint normally.
  if (random() >= SETTINGS.artifact.chance) {
    return false;
  }

  const state = createTextArtifactState(region);

  if (!state) {
    return false;
  }

  generationRegionArtifacts.set(regionKey, state);
  drawTextArtifact(region, state, targetLayer);

  return true;
}

function createTextArtifactState(region) {
  const entry = chooseWeightedArtifactEntry();

  if (!entry) {
    return null;
  }

  const img = artifactImages.get(entry.file);

  if (!img) {
    return null;
  }

  const anchor = chooseCenteredRegionPoint(region);

  if (!anchor) {
    return null;
  }

  const regionWidth =
    region.bounds.maxX - region.bounds.minX + 1;

  const regionHeight =
    region.bounds.maxY - region.bounds.minY + 1;

  // Fit the scrap roughly inside the region bounds,
  // then allow some variation.
  const fitScale =
    min(
      (regionWidth * SETTINGS.artifact.fitScale) / img.width,
      (regionHeight * SETTINGS.artifact.fitScale) / img.height
    );

  const scale =
    fitScale *
    random(
      SETTINGS.artifact.scaleMin,
      SETTINGS.artifact.scaleMax
    );

  return {
    file: entry.file,
    x: anchor.x,
    y: anchor.y,
    scale: max(0.05, scale),
    rotation: chooseArtifactRotation(),
    alpha: random(
      SETTINGS.artifact.alphaMin,
      SETTINGS.artifact.alphaMax
    )
  };
}

function drawTextArtifact(
  region,
  state,
  targetLayer
) {
  const img = artifactImages.get(state.file);

  if (!img) {
    return;
  }

  const tempLayer = createGraphics(width, height);
  tempLayer.clear();

  tempLayer.push();
  tempLayer.imageMode(CENTER);
  tempLayer.translate(state.x, state.y);
  tempLayer.rotate(state.rotation);
  tempLayer.tint(255, state.alpha);

  tempLayer.image(
    img,
    0,
    0,
    img.width * state.scale,
    img.height * state.scale
  );

  tempLayer.noTint();
  tempLayer.pop();

  compositeRegionPaint(
    tempLayer,
    region,
    targetLayer,
    activeViewport
  );

  tempLayer.remove();
}

function chooseWeightedArtifactEntry() {
  if (!artifactEntries.length) {
    return null;
  }

  let totalWeight = 0;

  for (const entry of artifactEntries) {
    totalWeight += Number(entry.weight || 1);
  }

  let roll = random(totalWeight);

  for (const entry of artifactEntries) {
    roll -= Number(entry.weight || 1);

    if (roll <= 0) {
      return entry;
    }
  }

  return artifactEntries[artifactEntries.length - 1];
}

function chooseCenteredRegionPoint(region) {
  if (!region?.pixels?.length) {
    return null;
  }

  const cx =
    (region.bounds.minX + region.bounds.maxX) * 0.5;

  const cy =
    (region.bounds.minY + region.bounds.maxY) * 0.5;

  let bestPoint = null;
  let bestDist = Infinity;

  const sampleCount =
    min(60, region.pixels.length);

  for (let i = 0; i < sampleCount; i++) {
    const p = random(region.pixels);
    const d = dist(p.x, p.y, cx, cy);

    if (d < bestDist) {
      bestDist = d;
      bestPoint = p;
    }
  }

  return bestPoint || random(region.pixels);
}

function chooseArtifactRotation() {
  // Most text retains a recognizable page/print orientation.
  if (random() < 0.8) {
    const baseRotation = random([
      0,
      HALF_PI,
      PI,
      PI + HALF_PI
    ]);

    // Slight imperfection: about +/- 8 degrees.
    return baseRotation + random(-0.14, 0.14);
  }

  // Occasionally let a scrap land at any angle.
  return random(-PI, PI);
}