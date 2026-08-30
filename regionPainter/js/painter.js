function paintRegion(region, g, baseColor) {
  const regionFactor = getRegionSizeFactor(region);

  const brushMin = SETTINGS.paint.brushSizeMin * regionFactor;
  const brushMax = SETTINGS.paint.brushSizeMax * regionFactor;

  const marks = floor(SETTINGS.paint.marksPerRegion * regionFactor);

  for (let i = 0; i < marks; i++) {
    const p = random(region.pixels);
    const size = random(brushMin, brushMax);
    const alpha = random(
      SETTINGS.paint.alphaMin,
      SETTINGS.paint.alphaMax
    );

    stampBrush(g, p.x, p.y, size, baseColor, alpha);
  }
}

function getRegionSizeFactor(region) {
  const minPixels = SETTINGS.fill.minRegionPixels;
  const maxPixels = width * height * SETTINGS.fill.maxRegionFraction;

  const t = constrain(
    map(region.pixelCount, minPixels, maxPixels, 0.6, 1.8),
    0.6,
    1.8
  );

  return t;
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