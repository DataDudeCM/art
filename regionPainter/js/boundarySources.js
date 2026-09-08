function buildChaikinBoundaryFromControlPoints(controlPoints) {
  let processedPoints =
    controlPoints.map(p =>
      p.copy
        ? p.copy()
        : createVector(p.x, p.y)
    );

  processedPoints =
    softenControlPoints(
      processedPoints,
      SETTINGS.boundary.cornerSoftness,
      SETTINGS.boundary.softeningPasses
    );

  const points =
    chaikin(
      processedPoints,
      SETTINGS.boundary.subdivisions
    );

  return {
    type: "path",

    controlPoints:
      processedPoints.map(p => ({
        x: p.x,
        y: p.y
      })),

    points:
      points.map(p => ({
        x: p.x,
        y: p.y
      })),

    closed: true
  };
}

function createChaikinBoundarySource() {
  return {
    type: "chaikin",

    generate() {
      const controlPoints =
        generateControlPoints(
          SETTINGS.boundary.pointCount,
          SETTINGS.boundary.scale
        );

      return buildChaikinBoundaryFromControlPoints(
        controlPoints
      );
    }
  };
}

function createParticleChaikinBoundarySource() {
  return {
    type: "particleChaikin",

    generate() {
      const controlPoints =
        generateParticleControlPoints();

      return buildChaikinBoundaryFromControlPoints(
        controlPoints
      );
    }
  };
}

function generateParticleControlPoints() {
  const targetCount =
    max(4, SETTINGS.boundary.pointCount);

  const particleCount =
    max(1, SETTINGS.particle.count);

  const bounds =
    getParticleBounds(
      SETTINGS.boundary.scale
    );

  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push(
      createBoundaryParticle(bounds)
    );
  }

  const samplesByParticle =
    particles.map(() => []);

  let totalSamples = 0;
  let steps = 0;

  const maxSteps =
    targetCount *
    SETTINGS.particle.sampleEvery *
    SETTINGS.particle.maxStepsMultiplier;

  while (
    totalSamples < targetCount &&
    steps < maxSteps
  ) {
    for (const particle of particles) {
      updateBoundaryParticle(
        particle,
        bounds
      );
    }

    if (
      steps %
        SETTINGS.particle.sampleEvery ===
      0
    ) {
      for (
        let i = 0;
        i < particles.length;
        i++
      ) {
        if (totalSamples >= targetCount) {
          break;
        }

        samplesByParticle[i].push(
          particles[i].pos.copy()
        );

        totalSamples++;
      }
    }

    steps++;
  }

  let points;

  switch (SETTINGS.particle.feedMode) {
    case "sequential":
      points =
        buildSequentialParticlePoints(
          samplesByParticle,
          targetCount
        );
      break;

    case "randomParticle":
      points =
        buildRandomParticlePoints(
          samplesByParticle,
          targetCount
        );
      break;

    case "roundRobin":
    default:
      points =
        buildRoundRobinParticlePoints(
          samplesByParticle,
          targetCount
        );
      break;
  }

  if (points.length < 4) {
    return generateControlPoints(
      targetCount,
      SETTINGS.boundary.scale
    );
  }

  return points;
}

function buildRoundRobinParticlePoints(
  samplesByParticle,
  targetCount
) {
  const points = [];

  let sampleIndex = 0;

  while (points.length < targetCount) {
    let addedAny = false;

    for (
      let p = 0;
      p < samplesByParticle.length;
      p++
    ) {
      const sample =
        samplesByParticle[p][sampleIndex];

      if (!sample) {
        continue;
      }

      points.push(sample.copy());
      addedAny = true;

      if (points.length >= targetCount) {
        break;
      }
    }

    if (!addedAny) {
      break;
    }

    sampleIndex++;
  }

  return points;
}

function buildSequentialParticlePoints(
  samplesByParticle,
  targetCount
) {
  const points = [];

  for (const samples of samplesByParticle) {
    for (const sample of samples) {
      points.push(sample.copy());

      if (points.length >= targetCount) {
        return points;
      }
    }
  }

  return points;
}

function buildRandomParticlePoints(
  samplesByParticle,
  targetCount
) {
  const pools =
    samplesByParticle.map(samples =>
      samples.map(p => p.copy())
    );

  const points = [];

  while (points.length < targetCount) {
    const available = [];

    for (let i = 0; i < pools.length; i++) {
      if (pools[i].length > 0) {
        available.push(i);
      }
    }

    if (available.length === 0) {
      break;
    }

    const particleIndex =
      random(available);

    points.push(
      pools[particleIndex].shift()
    );
  }

  return points;
}

function createBoundaryParticle(bounds) {
  return {
    pos: createVector(
      random(bounds.minX, bounds.maxX),
      random(bounds.minY, bounds.maxY)
    ),

    vel: p5.Vector.random2D().setMag(
      random(
        SETTINGS.particle.minSpeed,
        SETTINGS.particle.maxSpeed
      )
    ),

    noiseX: random(1000),
    noiseY: random(1000)
  };
}

function updateBoundaryParticle(
  particle,
  bounds
) {
  const angle =
    noise(
      particle.noiseX,
      particle.noiseY
    ) *
    TWO_PI *
    2;

  const steering =
    p5.Vector
      .fromAngle(angle)
      .mult(
        SETTINGS.particle.steeringStrength
      );

  particle.vel.add(steering);

  const speed =
    particle.vel.mag();

  if (
    speed <
    SETTINGS.particle.minSpeed
  ) {
    particle.vel.setMag(
      SETTINGS.particle.minSpeed
    );
  } else if (
    speed >
    SETTINGS.particle.maxSpeed
  ) {
    particle.vel.setMag(
      SETTINGS.particle.maxSpeed
    );
  }

  particle.pos.add(
    particle.vel
  );

  if (SETTINGS.particle.wrap) {
    wrapPositionToBounds(
      particle.pos,
      bounds
    );
  } else {
    bounceParticleInBounds(
      particle,
      bounds
    );
  }

  particle.noiseX +=
    SETTINGS.particle.noiseStep;

  particle.noiseY +=
    SETTINGS.particle.noiseStep *
    0.77;
}

function getParticleBounds(scale = 1.0) {
  const cx = width / 2;
  const cy = height / 2;

  const halfW = (width / 2) * scale;
  const halfH = (height / 2) * scale;

  return {
    minX: cx - halfW,
    maxX: cx + halfW,
    minY: cy - halfH,
    maxY: cy + halfH
  };
}

function wrapPositionToBounds(pos, bounds) {
  if (pos.x < bounds.minX) {
    pos.x = bounds.maxX;
  } else if (pos.x > bounds.maxX) {
    pos.x = bounds.minX;
  }

  if (pos.y < bounds.minY) {
    pos.y = bounds.maxY;
  } else if (pos.y > bounds.maxY) {
    pos.y = bounds.minY;
  }
}

function bounceParticleInBounds(particle, bounds) {
  if (particle.pos.x < bounds.minX) {
    particle.pos.x = bounds.minX;
    particle.vel.x *= -1;
  } else if (particle.pos.x > bounds.maxX) {
    particle.pos.x = bounds.maxX;
    particle.vel.x *= -1;
  }

  if (particle.pos.y < bounds.minY) {
    particle.pos.y = bounds.minY;
    particle.vel.y *= -1;
  } else if (particle.pos.y > bounds.maxY) {
    particle.pos.y = bounds.maxY;
    particle.vel.y *= -1;
  }
}

function createRectangleBoundarySource() {
  return {
    type: "rectangle",

    generate() {
      const rectWidth = width * 0.35;
      const rectHeight = height * 0.35;

      const rectX = (width - rectWidth) / 2;
      const rectY = (height - rectHeight) / 2;

      const points = [
        { x: rectX, y: rectY },
        { x: rectX + rectWidth, y: rectY },
        { x: rectX + rectWidth, y: rectY + rectHeight },
        { x: rectX, y: rectY + rectHeight }
      ];

      return {
        type: "path",
        controlPoints: [],
        points: points,
        closed: true
      };
    }
  };
}

let drawnBoundaryStrokes = [];

function createDrawnBoundarySource() {
  return {
    type: "drawn",

    generate() {
      return {
        type: "drawn",
        strokes: drawnBoundaryStrokes.map(stroke => ({
          points: stroke.points.map(p => ({
            x: p.x,
            y: p.y,
            time: p.time,
            pressure: p.pressure
          })),
          closed: false
        }))
      };
    }
  };
}

const BOUNDARY_SOURCES = {
  chaikin: createChaikinBoundarySource,
  particleChaikin: createParticleChaikinBoundarySource,
  rectangle: createRectangleBoundarySource,
  drawn: createDrawnBoundarySource
};

function getActiveBoundarySource() {
  const sourceFactory =
    BOUNDARY_SOURCES[SETTINGS.boundary.source];

  if (!sourceFactory) {
    console.warn(
      `Unknown boundary source: ${SETTINGS.boundary.source}. Falling back to Chaikin.`
    );

    return createChaikinBoundarySource();
  }

  return sourceFactory();
}