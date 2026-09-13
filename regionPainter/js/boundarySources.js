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
          SETTINGS.boundary.scale,
          activeViewport
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
        generateParticleControlPoints(
          activeViewport
        );

      return buildChaikinBoundaryFromControlPoints(
        controlPoints
      );
    }
  };
}

function generateParticleControlPoints(
  viewport = getFullCanvasViewport()
) {
  const targetCount =
    max(4, SETTINGS.boundary.pointCount);

  const particleCount =
    max(1, SETTINGS.particle.count);

  const bounds =
    getParticleBounds(
      SETTINGS.boundary.scale,
      viewport
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
  
  const samplingGap =
    SETTINGS.particle.samplingMode ===
    "headingChange"
      ? SETTINGS.particle.maxSampleGap
      : SETTINGS.particle.sampleEvery;

  const maxSteps =
    targetCount *
    samplingGap *
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

    for (
      let i = 0;
      i < particles.length;
      i++
    ) {
      const particle =
        particles[i];

      particle.stepsSinceSample++;

      if (
        shouldSampleParticle(
          particle,
          steps
        )
      ) {
        samplesByParticle[i].push(
          particle.pos.copy()
        );

        particle.lastSampleHeading =
          particle.vel.heading();

        particle.stepsSinceSample = 0;

        totalSamples++;

        if (totalSamples >= targetCount) {
          break;
        }
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
      SETTINGS.boundary.scale,
      viewport
    );
  }

  return points;
}

function createParticleBoundaryState(
  viewport = getFullCanvasViewport()
) {
  const particleCount =
    max(1, SETTINGS.particle.count);

  const bounds =
    getParticleBounds(
      SETTINGS.boundary.scale,
      viewport
    );

  return {
    viewport,
    bounds,

    particles: Array.from(
      { length: particleCount },
      () => createBoundaryParticle(bounds)
    ),

    samplesByParticle:
      Array.from(
        { length: particleCount },
        () => []
      ),

    totalSamples: 0,
    steps: 0,
    done: false
  };
}

function stepParticleBoundaryState(state) {
  const targetCount =
    max(4, SETTINGS.boundary.pointCount);

  const samplingGap =
    SETTINGS.particle.samplingMode ===
    "headingChange"
      ? SETTINGS.particle.maxSampleGap
      : SETTINGS.particle.sampleEvery;

  const maxSteps =
    targetCount *
    samplingGap *
    SETTINGS.particle.maxStepsMultiplier;

  if (
    state.done ||
    state.totalSamples >= targetCount ||
    state.steps >= maxSteps
  ) {
    state.done = true;
    return [];
  }

  const newSamples = [];

  for (const particle of state.particles) {
    updateBoundaryParticle(
      particle,
      state.bounds
    );
  }

  for (let i = 0; i < state.particles.length; i++) {
    const particle = state.particles[i];

    particle.stepsSinceSample++;

    if (
      shouldSampleParticle(
        particle,
        state.steps
      )
    ) {
      const sample = particle.pos.copy();

      state.samplesByParticle[i].push(sample);
      particle.lastSampleHeading =
        particle.vel.heading();
      particle.stepsSinceSample = 0;

      state.totalSamples++;

      newSamples.push({
        particleIndex: i,
        point: sample.copy()
      });

      if (state.totalSamples >= targetCount) {
        break;
      }
    }
  }

  state.steps++;

  if (
    state.totalSamples >= targetCount ||
    state.steps >= maxSteps
  ) {
    state.done = true;
  }

  return newSamples;
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

//converts a finished animation particle state into a set of control points for the boundary
function finalizeParticleBoundaryPoints(state) {
  const targetCount =
    max(4, SETTINGS.boundary.pointCount);

  let points;

  switch (SETTINGS.particle.feedMode) {
    case "sequential":
      points = buildSequentialParticlePoints(
        state.samplesByParticle,
        targetCount
      );
      break;

    case "randomParticle":
      points = buildRandomParticlePoints(
        state.samplesByParticle,
        targetCount
      );
      break;

    case "roundRobin":
    default:
      points = buildRoundRobinParticlePoints(
        state.samplesByParticle,
        targetCount
      );
      break;
  }

  if (points.length < 4) {
    return generateControlPoints(
      targetCount,
      SETTINGS.boundary.scale,
      state.viewport ||
        getFullCanvasViewport()
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

    vel: p5.Vector
      .fromAngle(random(TWO_PI))
      .setMag(
        random(
          SETTINGS.particle.minSpeed,
          SETTINGS.particle.maxSpeed
        )
      ),

    noiseX: random(1000),
    noiseY: random(1000),

    lastSampleHeading: null,
    stepsSinceSample: 0
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
  if (
    SETTINGS.particle.motionMode ===
    "attractor"
  ) {
    applyAttractorForce(
      particle,
      activeViewport
    );
  }

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

function applyAttractorForce(
  particle,
  viewport = getFullCanvasViewport()
) {
  const attractor =
    createVector(
      viewport.x +
        viewport.width / 2,

      viewport.y +
        viewport.height / 2
    );

  const force =
    p5.Vector.sub(
      attractor,
      particle.pos
    );

  if (force.magSq() === 0) {
    return;
  }

  force
    .normalize()
    .mult(
      SETTINGS.particle.attractorStrength
    );

  particle.vel.add(force);
}

function getParticleBounds(
  scale = 1.0,
  viewport = getFullCanvasViewport()
) {
  const cx =
    viewport.x +
    viewport.width / 2;

  const cy =
    viewport.y +
    viewport.height / 2;

  const halfW =
    (viewport.width / 2) *
    scale;

  const halfH =
    (viewport.height / 2) *
    scale;

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

function shouldSampleParticle(
  particle,
  globalStep
) {
  const mode =
    SETTINGS.particle.samplingMode;

  if (mode === "interval") {
    return (
      globalStep %
        SETTINGS.particle.sampleEvery ===
      0
    );
  }

  if (mode === "headingChange") {
    const currentHeading =
      particle.vel.heading();

    // Always capture the first available point.
    if (particle.lastSampleHeading === null) {
      return true;
    }

    const change =
      abs(
        angleDifference(
          currentHeading,
          particle.lastSampleHeading
        )
      );

    const headingTriggered =
      change >=
      SETTINGS.particle.headingChangeThreshold;

    const gapTriggered =
      particle.stepsSinceSample >=
      SETTINGS.particle.maxSampleGap;

    return headingTriggered || gapTriggered;
  }

  return false;
}

function angleDifference(a, b) {
  let diff = a - b;

  while (diff > PI) {
    diff -= TWO_PI;
  }

  while (diff < -PI) {
    diff += TWO_PI;
  }

  return diff;
}

function createRectangleBoundarySource() {
  return {
    type: "rectangle",

    generate() {
      const viewport =
        activeViewport ||
        getFullCanvasViewport();

      const rectWidth =
        viewport.width *
        0.35 *
        SETTINGS.boundary.scale;

      const rectHeight =
        viewport.height *
        0.35 *
        SETTINGS.boundary.scale;

      const centerX =
        viewport.x +
        viewport.width / 2;

      const centerY =
        viewport.y +
        viewport.height / 2;

      const rectX =
        centerX -
        rectWidth / 2;

      const rectY =
        centerY -
        rectHeight / 2;

      const points = [
        {
          x: rectX,
          y: rectY
        },
        {
          x: rectX + rectWidth,
          y: rectY
        },
        {
          x: rectX + rectWidth,
          y: rectY + rectHeight
        },
        {
          x: rectX,
          y: rectY + rectHeight
        }
      ];

      return {
        type: "path",
        controlPoints: [],
        points,
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

function moveParticleBoundaryState(state) {
  for (const particle of state.particles) {
    updateBoundaryParticle(
      particle,
      state.bounds
    );
  }

  state.steps++;
}