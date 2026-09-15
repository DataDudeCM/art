  
function generateControlPoints(
  count,
  scale = 1.0,
  viewport = getFullCanvasViewport()
) {
  viewport =
    viewport || getFullCanvasViewport();

  const points = [];

  const cx =
    viewport.x + viewport.width / 2;

  const cy =
    viewport.y + viewport.height / 2;

  const halfW =
    (viewport.width / 2) * scale;

  const halfH =
    (viewport.height / 2) * scale;

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

function drawClippedToViewport(
  g,
  viewport,
  drawFn
) {
  const clipViewport =
    viewport || getFullCanvasViewport();

  g.push();

  const ctx = g.drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    clipViewport.x,
    clipViewport.y,
    clipViewport.width,
    clipViewport.height
  );
  ctx.clip();

  drawFn();

  ctx.restore();
  g.pop();
}

function drawDetectionBoundary(g, points, closed=true) {

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

  if (closed) {
    g.endShape(CLOSE);
  } else {
    g.endShape();
  }

  g.pop();
}

function drawVisibleBoundary(g, points, closed = true) {
  if (
    SETTINGS.boundary.brushMode !== "image" ||
    brushImages.length === 0
  ) {
    drawVisibleBoundaryLine(
      g,
      points,
      closed
    );

    return;
  }

  const brush =
    chooseBoundaryBrush();

  if (!brush) {
    drawVisibleBoundaryLine(
      g,
      points,
      closed
    );

    return;
  }

  const boundaryColor =
    generationBoundaryColor ||
    getDarkColor(palette);

  stampBoundaryPath(
    g,
    points,
    brush,
    boundaryColor,
    closed
  );
}

function drawVisibleBoundaryLine(g, points, closed=true) {
  g.push();

  g.noFill();
  g.stroke(getDarkColor(palette));

  const viewportScale =
    activeViewport
      ? sqrt(
          min(
            activeViewport.width / width,
            activeViewport.height / height
          )
        )
      : 1;

  g.strokeWeight(
    SETTINGS.boundary.thinBrushSize *
    viewportScale
  );

  g.strokeJoin(ROUND);
  g.strokeCap(ROUND);

  g.beginShape();

  for (const p of points) {
    g.vertex(p.x, p.y);
  }

  if (closed) {
    g.endShape(CLOSE);
  } else {
    g.endShape();
  }

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
  boundaryColor,
  closed = true
) {
  const spacing =
    SETTINGS.boundary.brushSpacing;

  const subdivisionsPerSegment =
    2 ** SETTINGS.boundary.subdivisions;

  const segmentCount =
    closed
      ? points.length
      : points.length - 1;

  for (let i = 0; i < segmentCount; i++) {
    const a = points[i];

    const b =
      closed
        ? points[(i + 1) % points.length]
        : points[i + 1];

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

  const viewportScale =
    activeViewport
      ? sqrt(
          min(
            activeViewport.width / width,
            activeViewport.height / height
          )
        )
      : 1;

  const baseSize =
    SETTINGS.boundary.thinBrushSize *
    viewportScale;

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
  const boundarySource =
    getActiveBoundarySource();

  const boundary =
    boundarySource.generate();

  const sourceStrokes =
    boundary.strokes || [
      {
        points: boundary.points || [],
        closed: boundary.closed ?? true
      }
    ];

  const primitiveStrokes =
    generatePrimitiveBoundaryStrokes(
      activeViewport
    );

  const strokes = [
    ...sourceStrokes,
    ...primitiveStrokes
  ];

  boundaryControlPoints =
    boundary.controlPoints || [];

  boundarySmoothedPoints =
    boundary.points || [];


  for (const stroke of strokes) {
    drawClippedToViewport(
      boundaryDetectionLayer,
      activeViewport,
      () => {
        drawDetectionBoundary(
          boundaryDetectionLayer,
          stroke.points,
          stroke.closed
        );
      }
    );

    drawClippedToViewport(
      boundaryLayer,
      activeViewport,
      () => {
        drawVisibleBoundary(
          boundaryLayer,
          stroke.points,
          stroke.closed
        );
      }
    );
  }

  return boundary;
}

function generatePrimitiveBoundaryStrokes(
  viewport = getFullCanvasViewport()
) {
  if (!SETTINGS.boundary.primitivesEnabled) {
    return [];
  }

  const strokes = [];

  const attempts =
    SETTINGS.boundary.primitiveAttempts;

  const chance =
    SETTINGS.boundary.primitiveChance;

  for (let i = 0; i < attempts; i++) {
    if (random() > chance) {
      continue;
    }

    strokes.push(
      generateRandomPrimitiveStroke(
        viewport
      )
    );
  }

  return strokes;
}


function generateRandomPrimitiveStroke(
  viewport
) {
  const type =
    random([
      "circle",
      "square",
      "triangle"
    ]);

  const minDimension =
    min(
      viewport.width,
      viewport.height
    );

  const size =
    random(
      minDimension *
        SETTINGS.boundary.primitiveMinScale,

      minDimension *
        SETTINGS.boundary.primitiveMaxScale
    );

  const x =
    random(
      viewport.x,
      viewport.x + viewport.width
    );

  const y =
    random(
      viewport.y,
      viewport.y + viewport.height
    );

  switch (type) {
    case "square":
      return createSquarePrimitiveStroke(
        x,
        y,
        size
      );

    case "triangle":
      return createTrianglePrimitiveStroke(
        x,
        y,
        size
      );

    case "circle":
    default:
      return createCirclePrimitiveStroke(
        x,
        y,
        size
      );
  }
}


function createCirclePrimitiveStroke(
  cx,
  cy,
  diameter
) {
  const points = [];

  const radius =
    diameter / 2;

  const segmentCount = 40;

  for (
    let i = 0;
    i < segmentCount;
    i++
  ) {
    const angle =
      map(
        i,
        0,
        segmentCount,
        0,
        TWO_PI
      );

    points.push({
      x:
        cx +
        cos(angle) * radius,

      y:
        cy +
        sin(angle) * radius
    });
  }

  return {
    points,
    closed: true
  };
}


function createSquarePrimitiveStroke(
  cx,
  cy,
  size
) {
  const half =
    size / 2;

  return {
    points: [
      {
        x: cx - half,
        y: cy - half
      },
      {
        x: cx + half,
        y: cy - half
      },
      {
        x: cx + half,
        y: cy + half
      },
      {
        x: cx - half,
        y: cy + half
      }
    ],
    closed: true
  };
}


function createTrianglePrimitiveStroke(
  cx,
  cy,
  size
) {
  const half =
    size / 2;

  return {
    points: [
      {
        x: cx,
        y: cy - half
      },
      {
        x: cx + half,
        y: cy + half
      },
      {
        x: cx - half,
        y: cy + half
      }
    ],
    closed: true
  };
}
