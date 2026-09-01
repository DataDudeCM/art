function generateControlPoints(count, scale = 1.0) {
  const points = [];

  const cx = width / 2;
  const cy = height / 2;

  const halfW = (width / 2) * scale;
  const halfH = (height / 2) * scale;

  for (let i = 0; i < count; i++) {
    points.push(
      createVector(
        random(cx - halfW, cx + halfW),
        random(cy - halfH, cy + halfH)
      )
    );
  }

  return points;
}

function softenControlPoints(points, amount = 0.25, passes = 1) {
  let result = points.map(p => p.copy());

  for (let pass = 0; pass < passes; pass++) {
    const next = [];

    for (let i = 0; i < result.length; i++) {
      const prev = result[(i - 1 + result.length) % result.length];
      const current = result[i];
      const following = result[(i + 1) % result.length];

      const midpoint = p5.Vector.add(prev, following).mult(0.5);

      next.push(
        p5.Vector.lerp(current, midpoint, amount)
      );
    }

    result = next;
  }

  return result;
}

function lerpAngle(a, b, amount) {
  let diff = atan2(sin(b - a), cos(b - a));
  return a + diff * amount;
}

function chaikin(points, iterations = 1) {
  let result = points.map(p => p.copy());

  for (let iter = 0; iter < iterations; iter++) {
    const next = [];
    const count = result.length;

    for (let i = 0; i < count; i++) {
      const p0 = result[i];
      const p1 = result[(i + 1) % count];

      const q =
        p5.Vector.lerp(p0, p1, 0.25);

      const r =
        p5.Vector.lerp(p0, p1, 0.75);

      next.push(q);
      next.push(r);
    }

    result = next;
  }

  return result;
}

function drawDetectionBoundary(g, points) {
  g.clear();

  g.push();

  g.noFill();

  // Color doesn't matter much here.
  // Alpha/continuity are what flood fill cares about.
  g.stroke(0);

  g.strokeWeight(1);

  g.strokeJoin(ROUND);
  g.strokeCap(ROUND);

  g.beginShape();

  for (const p of points) {
    g.vertex(p.x, p.y);
  }

  g.endShape(CLOSE);

  g.pop();
}

function drawVisibleBoundary(g, points) {
  g.clear();

  if (
    SETTINGS.boundary.brushMode !== "image" ||
    brushImages.length === 0
  ) {
    drawVisibleBoundaryLine(g, points);
    return;
  }

  const brush = chooseBoundaryBrush();

  if (!brush) {
    drawVisibleBoundaryLine(g, points);
    return;
  }

  const boundaryColor = getDarkColor(palette);

  stampBoundaryPath(
    g,
    points,
    brush,
    boundaryColor
  );
}

function drawVisibleBoundaryLine(g, points) {
  g.push();

  g.noFill();
  g.stroke(getDarkColor(palette));

  g.strokeWeight(
    SETTINGS.boundary.thinBrushSize
  );

  g.strokeJoin(ROUND);
  g.strokeCap(ROUND);

  g.beginShape();

  for (const p of points) {
    g.vertex(p.x, p.y);
  }

  g.endShape(CLOSE);

  g.pop();
}


function chooseBoundaryBrush() {
  if (brushImages.length === 0) {
    return null;
  }

  const forcedName =
    SETTINGS.boundary.forcedBrush;

  if (forcedName) {
    const index =
      brushNames.indexOf(forcedName);

    if (index !== -1) {
      return {
        name: brushNames[index],
        image: brushImages[index]
      };
    }
  }

  const index =
    floor(random(brushImages.length));

  return {
    name: brushNames[index],
    image: brushImages[index]
  };
}

function stampBoundaryPath(
  g,
  points,
  brushInfo,
  boundaryColor
) {
  const spacing =
    SETTINGS.boundary.brushSpacing;

  const subdivisionsPerSegment =
    2 ** SETTINGS.boundary.subdivisions;

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const segmentLength =
      sqrt(dx * dx + dy * dy);

    if (segmentLength === 0) {
      continue;
    }

    const angle =
      atan2(dy, dx);

    const steps =
      max(1, ceil(segmentLength / spacing));

    // Position within the original large segment
    const localSegmentIndex =
      i % subdivisionsPerSegment;

    const segmentT =
      localSegmentIndex /
      subdivisionsPerSegment;

    // Thin -> thick -> thin across the original segment
    const peak =
      SETTINGS.boundary.peakPosition;

    let profile;

    if (segmentT <= peak) {
      profile =
        segmentT / peak;
    } else {
      profile =
        1 -
        (segmentT - peak) /
        (1 - peak);
    }

    profile =
      profile * profile *
      (3 - 2 * profile);

    const sizeMultiplier =
      lerp(
        1,
        SETTINGS.boundary.midSizeMultiplier,
        profile
      );

    for (let j = 0; j < steps; j++) {
      const t = j / steps;

      const x =
        lerp(a.x, b.x, t);

      const y =
        lerp(a.y, b.y, t);

      stampBoundaryBrush(
        g,
        brushInfo,
        x,
        y,
        angle,
        boundaryColor,
        sizeMultiplier
      );
    }
  }
}

function stampBoundaryBrush(
  g,
  brushInfo,
  x,
  y,
  angle,
  boundaryColor,
  sizeMultiplier = 1
) {
  const brush = brushInfo?.image;

  if (!brush) {
    return;
  }

  const baseSize =
    SETTINGS.boundary.thinBrushSize;

  const jitter =
    SETTINGS.boundary.sizeJitter;

  const size =
    baseSize *
    sizeMultiplier *
    random(1 - jitter, 1 + jitter);

  const rotation =
    angle +
    random(
      -SETTINGS.boundary.rotationJitter,
      SETTINGS.boundary.rotationJitter
    );

  const col = color(boundaryColor);

  g.push();
  g.translate(x, y);
  g.rotate(rotation);
  g.imageMode(CENTER);

  g.tint(
    red(col),
    green(col),
    blue(col),
    SETTINGS.boundary.brushAlpha
  );

  g.image(
    brush,
    0,
    0,
    size,
    size
  );

  g.noTint();
  g.pop();
}

function generateBoundary() {
  let controlPoints =
    generateControlPoints(
      SETTINGS.boundary.pointCount,
      SETTINGS.boundary.scale
    );

  controlPoints =
    softenControlPoints(
      controlPoints,
      SETTINGS.boundary.cornerSoftness,
      SETTINGS.boundary.softeningPasses
    );

  const smoothedPoints =
    chaikin(
      controlPoints,
      SETTINGS.boundary.subdivisions
    );

  drawDetectionBoundary(
    boundaryDetectionLayer,
    smoothedPoints
  );

  drawVisibleBoundary(
    boundaryLayer,
    smoothedPoints
  );

  return {
    controlPoints,
    smoothedPoints
  };
}