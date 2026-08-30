function paintRegion(region, g, baseColor) {
  const markScale = getRegionMarkScale(region);
  const brushScale = getRegionBrushScale(region);

  const marks = floor(
    SETTINGS.paint.marksPerRegion * markScale
  );

  const brushMin =
    SETTINGS.paint.brushSizeMin * brushScale;

  const brushMax =
    SETTINGS.paint.brushSizeMax * brushScale;

  // Paint freely onto a temporary layer.
  const tempLayer = createGraphics(width, height);
  tempLayer.clear();

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
      tempLayer,
      p.x,
      p.y,
      size,
      baseColor,
      alpha
    );
  }

  // Clip all of that paint to the detected flood-fill region.
  compositeRegionPaint(
    tempLayer,
    region,
    g
  );

  tempLayer.remove();
}


// --------------------------------------------------
// Region scaling
// --------------------------------------------------

function getRegionMarkScale(region) {
  const ratio =
    region.pixelCount /
    SETTINGS.paint.referenceRegionPixels;

  return constrain(
    pow(ratio, SETTINGS.paint.markAreaExponent),
    SETTINGS.paint.minMarkScale,
    SETTINGS.paint.maxMarkScale
  );
}


function getRegionBrushScale(region) {
  const ratio =
    region.pixelCount /
    SETTINGS.paint.referenceRegionPixels;

  return constrain(
    pow(ratio, SETTINGS.paint.brushAreaExponent),
    SETTINGS.paint.minBrushScale,
    SETTINGS.paint.maxBrushScale
  );
}


// --------------------------------------------------
// Region mask / clipping
// --------------------------------------------------

function compositeRegionPaint(tempLayer, region, targetLayer) {
  const paintImage = tempLayer.get();

  const maskImage = createImage(width, height);

  maskImage.loadPixels();

  // Start fully transparent.
  for (let i = 0; i < maskImage.pixels.length; i += 4) {
    maskImage.pixels[i] = 0;
    maskImage.pixels[i + 1] = 0;
    maskImage.pixels[i + 2] = 0;
    maskImage.pixels[i + 3] = 0;
  }

  // Make flood-filled region opaque in the mask.
  for (const p of region.pixels) {
    const index = 4 * (p.y * width + p.x);

    maskImage.pixels[index] = 255;
    maskImage.pixels[index + 1] = 255;
    maskImage.pixels[index + 2] = 255;
    maskImage.pixels[index + 3] = 255;
  }

  maskImage.updatePixels();

  paintImage.mask(maskImage);

  targetLayer.image(
    paintImage,
    0,
    0
  );
}


// --------------------------------------------------
// Procedural brush
// --------------------------------------------------

function stampBrush(g, x, y, size, c, alpha) {
  g.push();
  g.noStroke();

  const col = color(c);

  for (let i = 0; i < 6; i++) {
    const ox =
      random(-size * 0.18, size * 0.18);

    const oy =
      random(-size * 0.18, size * 0.18);

    const r =
      size * random(0.7, 1.2);

    g.fill(
      red(col),
      green(col),
      blue(col),
      alpha
    );

    g.circle(
      x + ox,
      y + oy,
      r
    );
  }

  g.pop();
}