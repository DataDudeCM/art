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

  const regionBrush =
    chooseRegionBrush();

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
      alpha,
      regionBrush
    );
  }

  // Clip all of that paint to the detected flood-fill region.
  compositeRegionPaint(
    tempLayer,
    region,
    g
  );

  paintRegionBleed(
    region,
    g,
    baseColor,
    brushMin,
    brushMax,
    regionBrush
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
  const expand =
    SETTINGS.paint.maskExpansionPixels || 0;

  for (const p of region.pixels) {
    for (let oy = -expand; oy <= expand; oy++) {
      for (let ox = -expand; ox <= expand; ox++) {
        const x = p.x + ox;
        const y = p.y + oy;

        if (
          x < 0 ||
          x >= width ||
          y < 0 ||
          y >= height
        ) {
          continue;
        }

        const index =
          4 * (y * width + x);

        maskImage.pixels[index] = 255;
        maskImage.pixels[index + 1] = 255;
        maskImage.pixels[index + 2] = 255;
        maskImage.pixels[index + 3] = 255;
      }
    }
  }

  maskImage.updatePixels();

  paintImage.mask(maskImage);

  targetLayer.image(
    paintImage,
    0,
    0
  );
}

function paintRegionBleed(
  region,
  g,
  baseColor,
  brushMin,
  brushMax,
  regionBrush
) {
  const edgePixels = findRegionEdgePixels(region);

  if (edgePixels.length === 0) {
    return;
  }

  const bleedBrush =
    SETTINGS.paint.useSameBrushForBleed
      ? regionBrush
      : chooseRegionBrush();

  for (let i = 0; i < SETTINGS.paint.bleedMarks; i++) {
    const p = random(edgePixels);

    const angle = random(TWO_PI);
    const distance = random(SETTINGS.paint.bleedPixels);

    const x = p.x + cos(angle) * distance;
    const y = p.y + sin(angle) * distance;

    const bleedT =
      distance / max(1, SETTINGS.paint.bleedPixels);

    // Smaller marks the farther they wander outward
    const edgeScale = lerp(0.5, 0.05, bleedT);

    const size = random(
      brushMin * edgeScale,
      brushMax * edgeScale
    );

    const alpha = random(
      SETTINGS.paint.bleedAlphaMin,
      SETTINGS.paint.bleedAlphaMax
    );

    stampBrush(
      g,
      x,
      y,
      size,
      baseColor,
      alpha,
      bleedBrush
    );
  }
}

function findRegionEdgePixels(region) {
  const regionSet = new Set();

  for (const p of region.pixels) {
    regionSet.add(p.y * width + p.x);
  }

  const edges = [];

  for (const p of region.pixels) {
    const x = p.x;
    const y = p.y;

    const left  = y * width + (x - 1);
    const right = y * width + (x + 1);
    const up    = (y - 1) * width + x;
    const down  = (y + 1) * width + x;

    if (
      x <= 0 ||
      x >= width - 1 ||
      y <= 0 ||
      y >= height - 1 ||
      !regionSet.has(left) ||
      !regionSet.has(right) ||
      !regionSet.has(up) ||
      !regionSet.has(down)
    ) {
      edges.push(p);
    }
  }

  return edges;
}

function chooseRegionBrush() {
  if (brushImages.length === 0) {
    return null;
  }

  const forcedName =
    SETTINGS.paint.forcedFillBrush;

  if (forcedName) {
    const forcedIndex =
      brushNames.indexOf(forcedName);

    if (forcedIndex !== -1) {
      return {
        name: brushNames[forcedIndex],
        image: brushImages[forcedIndex]
      };
    }

    console.warn(
      `Brush not found: ${forcedName}`
    );
  }

  const index =
    floor(random(brushImages.length));

  return {
    name: brushNames[index],
    image: brushImages[index]
  };
}

// --------------------------------------------------
// Procedural brush
// --------------------------------------------------

function stampBrush(g, x, y, size, c, alpha, brushInfo = null) {
  if (
    SETTINGS.paint.brushMode === "image" &&
    brushImages.length > 0
  ) {
    if (SETTINGS.paint.brushStrategy === "randomPerStamp") {
      brushInfo = chooseRegionBrush();
    }

    stampImageBrush(
      g,
      x,
      y,
      size,
      c,
      alpha,
      brushInfo
    );
  } else {
    stampProceduralBrush(
      g,
      x,
      y,
      size,
      c,
      alpha
    );
  }
}


function stampImageBrush(g, x, y, size, c, alpha, brushInfo) {
  const brush = brushInfo?.image;

  if (!brush) {
    stampProceduralBrush(g, x, y, size, c, alpha);
    return;
  }

  const col = color(c);

  const rotation = random(TWO_PI);
  const aspect = random(0.75, 1.35);

  const w = size * aspect;
  const h = size / aspect;

  g.push();
  g.translate(x, y);
  g.rotate(rotation);
  g.imageMode(CENTER);

  g.tint(
    red(col),
    green(col),
    blue(col),
    alpha
  );

  g.image(
    brush,
    0,
    0,
    w,
    h
  );

  g.noTint();
  g.pop();
}


function stampProceduralBrush(g, x, y, size, c, alpha) {
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