let regionMaskCanvas = null;
let regionMaskContext = null;
let regionMaskImageData = null;
let regionPaintTempLayer = null;

function ensureRegionPaintTempLayer() {
  if (
    regionPaintTempLayer &&
    regionPaintTempLayer.width === width &&
    regionPaintTempLayer.height === height
  ) {
    return;
  }

  if (regionPaintTempLayer) {
    regionPaintTempLayer.remove();
  }

  regionPaintTempLayer =
    createGraphics(width, height);
}

function paintRegion(region, g, baseColor) {
  const markScale = getRegionMarkScale(region);
  const brushScale = getRegionBrushScale(region);
  const viewportScale =
  activeViewport
    ? sqrt(
        min(
          activeViewport.width / width,
          activeViewport.height / height
        )
      )
    : 1;

  const marks = floor(
    SETTINGS.paint.marksPerRegion * markScale
  );

  const brushMin =
    SETTINGS.paint.brushSizeMin *
    brushScale *
    viewportScale;

  const brushMax =
    SETTINGS.paint.brushSizeMax *
    brushScale *
    viewportScale;

  const regionBrush =
    chooseRegionBrush();

  // Paint freely onto a temporary layer.
  ensureRegionPaintTempLayer();
  regionPaintTempLayer.clear();

  const brushStampStart =
    performance.now();

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
      regionPaintTempLayer,
      p.x,
      p.y,
      size,
      baseColor,
      alpha,
      regionBrush
    );
  }

  perfStats.brushStampMs +=
    performance.now() - brushStampStart;

  const compositeStart =
    performance.now();

  compositeRegionPaint(
    regionPaintTempLayer,
    region,
    g,
    activeViewport
  );

  perfStats.compositeMs +=
    performance.now() - compositeStart;

  paintRegionBleed(
    region,
    g,
    baseColor,
    brushMin,
    brushMax,
    regionBrush,
    activeViewport
  );

}

function paintRegionBleed(
  region,
  g,
  baseColor,
  brushMin,
  brushMax,
  regionBrush,
  viewport = getFullCanvasViewport()
) {
  const edgePixels =
    region.edgePixels || [];

  if (edgePixels.length === 0) {
    return;
  }

  const bleedBrush =
    SETTINGS.paint.useSameBrushForBleed
      ? regionBrush
      : chooseRegionBrush();

  const bleedStart =
    performance.now();

  drawClippedToViewport(
    g,
    viewport,
    () => {
      for (let i = 0; i < SETTINGS.paint.bleedMarks; i++) {
        const p = random(edgePixels);

        const angle = random(TWO_PI);
        const viewportScale =
          activeViewport
            ? sqrt(
                min(
                  activeViewport.width / width,
                  activeViewport.height / height
                )
              )
            : 1;

        const distance =
          random(
            SETTINGS.paint.bleedPixels *
            viewportScale
          );

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
  );

  perfStats.bleedMs +=
    performance.now() - bleedStart;
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

function ensureRegionMaskCanvas() {
  if (
    regionMaskCanvas &&
    regionMaskCanvas.width === width &&
    regionMaskCanvas.height === height
  ) {
    return;
  }

  regionMaskCanvas =
    document.createElement("canvas");

  regionMaskCanvas.width = width;
  regionMaskCanvas.height = height;

  regionMaskContext =
    regionMaskCanvas.getContext("2d");

  regionMaskImageData =
    regionMaskContext.createImageData(
      width,
      height
    );
}

function compositeRegionPaint(
  tempLayer,
  region,
  targetLayer,
  viewport = getFullCanvasViewport()
) {
  ensureRegionMaskCanvas();

  const maskPixels =
    regionMaskImageData.data;

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

  // Reset previous region mask.
  maskPixels.fill(0);

  const expand =
    SETTINGS.paint.maskExpansionPixels || 0;

  // Build the mask directly in memory.
  // Only alpha matters for destination-in.
  for (const p of region.pixels) {
    for (
      let oy = -expand;
      oy <= expand;
      oy++
    ) {
      for (
        let ox = -expand;
        ox <= expand;
        ox++
      ) {
        const x = p.x + ox;
        const y = p.y + oy;

        if (
          x < minViewportX ||
          x > maxViewportX ||
          y < minViewportY ||
          y > maxViewportY
        ) {
          continue;
        }

        const index =
          4 * (y * width + x);

        maskPixels[index + 3] = 255;
      }
    }
  }

  // Write the mask to its reusable canvas.
  regionMaskContext.putImageData(
    regionMaskImageData,
    0,
    0
  );

  // Clip the existing brush paint in-place.
  // This avoids tempLayer.get() and p5.Image.mask().
  const ctx =
    tempLayer.drawingContext;

  ctx.save();

  ctx.globalCompositeOperation =
    "destination-in";

  ctx.drawImage(
    regionMaskCanvas,
    0,
    0
  );

  ctx.restore();

  // Composite the already-clipped canvas
  // directly onto the final paint layer.
  drawClippedToViewport(
    targetLayer,
    viewport,
    () => {
      targetLayer.image(
        tempLayer,
        0,
        0
      );
    }
  );
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