function paintRegion(region, g, baseColor) {
  const regionFactor = getRegionSizeFactor(region);

  const brushFactor = regionFactor;

  // Damp the mark-count response
  const markFactor = lerp(
    1.0,
    regionFactor,
    0.45
  );

  const brushMin =
    SETTINGS.paint.brushSizeMin * brushFactor;

  const brushMax =
    SETTINGS.paint.brushSizeMax * brushFactor;

  const marks = floor(
    SETTINGS.paint.marksPerRegion * markFactor
  );

  for (let i = 0; i < marks; i++) {
    const p = random(region.pixels);

    const size = random(
      brushMin,
      brushMax
    );

    const alpha = random(
      SETTINGS.paint.alphaMin,
      SETTINGS.paint.alphaMax
    );

    stampBrush(
      g,
      p.x,
      p.y,
      size,
      baseColor,
      alpha
    );
  }
}

function getRegionSizeFactor(region) {
  // region size as fraction of the canvas
  const regionFraction =
    region.pixelCount / (width * height);

  // Tune these based on what your regions typically look like
  const smallRegion = 0.002;   // 0.2% of canvas
  const largeRegion = 0.10;    // 10% of canvas

  return constrain(
    map(
      regionFraction,
      smallRegion,
      largeRegion,
      0.5,
      1.75
    ),
    0.5,
    1.75
  );
}

function stampBrush(g, x, y, size, c, alpha) {
  g.push();
  g.noStroke();

  const col = color(c);

  for (let i = 0; i < 6; i++) {
    const ox = random(-size * 0.18, size * 0.18);
    const oy = random(-size * 0.18, size * 0.18);
    const r = size * random(0.7, 1.2);

    g.fill(red(col), green(col), blue(col), alpha);
    g.circle(x + ox, y + oy, r);
  }

  g.pop();
}