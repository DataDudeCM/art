const ANIMATION_PHASE = {
  IDLE: "idle",
  PARTICLE: "particle",
  BOUNDARY: "boundary",
  PAINT_PREP: "paintPrep",
  PAINT: "paint",
  COMPLETE: "complete"
};

let animationState = null;

function createAnimationState() {
  return {
    phase: ANIMATION_PHASE.IDLE,

    particleState: null,

    collectedControlPoints: [],
    revealedBoundaryCount: 0,
    lastBoundaryRevealCount: 0,
    particleStartMs: 0,
    paintAttemptsRemaining: 0,

    boundaryReady: null,
    paintQueue: [],

    particleTrails: [],
    sampledPoints: [],

    pauseUntilMs: 0
  };
}

//set correct starting phase and initialize state for that phase
function startGenerationAnimation() {
  animationState = createAnimationState();

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  generationRegionColors = new Map();

  if (SETTINGS.boundary.source === "particleChaikin") {
    animationState.phase =
      ANIMATION_PHASE.PARTICLE;

    animationState.particleStartMs =
      millis();

    animationState.particleState =
      createParticleBoundaryState();

    animationState.particleTrails =
      animationState.particleState.particles.map(
        particle => [
          {
            x: particle.pos.x,
            y: particle.pos.y
          }
        ]
      );
  } else {
    prepareBoundaryRevealFromCurrentSource();
  }
}

function prepareBoundaryRevealFromCurrentSource() {
  const boundarySource =
    getActiveBoundarySource();

  const boundary =
    boundarySource.generate();

  animationState.boundaryReady = boundary;

  animationState.revealedBoundaryCount = 0;
  animationState.lastBoundaryRevealCount = 0;

  boundaryLayer.clear();

  animationState.phase =
    ANIMATION_PHASE.BOUNDARY;
}

function finishParticlePhase() {
  const controlPoints =
    finalizeParticleBoundaryPoints(
      animationState.particleState
    );

  const boundary =
    buildChaikinBoundaryFromControlPoints(
      controlPoints
    );

  animationState.collectedControlPoints =
    controlPoints.map(p => p.copy());

  animationState.boundaryReady = boundary;

  animationState.revealedBoundaryCount = 0;
  animationState.lastBoundaryRevealCount = 0;

  boundaryLayer.clear();

  animationState.phase =
    ANIMATION_PHASE.BOUNDARY;
}

function updateBoundaryReveal() {
  const boundary =
    animationState.boundaryReady;

  if (!boundary) return;

  const total =
    boundary.points.length;

  animationState.revealedBoundaryCount =
    min(
      total,
      animationState.revealedBoundaryCount +
        SETTINGS.animation.boundaryRevealPointsPerFrame
    );

  if (
    animationState.revealedBoundaryCount >= total
  ) {
    finalizeBoundaryForDetection(boundary);

    animationState.pauseUntilMs =
      millis() +
      SETTINGS.animation.pauseAfterBoundaryMs;

    animationState.phase = ANIMATION_PHASE.PAINT_PREP;
  }
}

function renderPartialBoundary(boundary) {
  if (!boundary) {
    return;
  }

  const from =
    max(
      0,
      animationState.lastBoundaryRevealCount - 1
    );

  const to =
    animationState.revealedBoundaryCount;

  if (to - from < 2) {
    return;
  }

  const newPoints =
    boundary.points.slice(
      from,
      to
    );

  drawVisibleBoundary(
    boundaryLayer,
    newPoints,
    false
  );

  animationState.lastBoundaryRevealCount =
    animationState.revealedBoundaryCount;
}

function finalizeBoundaryForDetection(boundary) {
  boundaryControlPoints =
    boundary.controlPoints || [];

  boundarySmoothedPoints =
    boundary.points || [];

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();

  const strokes =
    boundary.strokes || [
      {
        points: boundary.points || [],
        closed: boundary.closed ?? true
      }
    ];

  for (const stroke of strokes) {
    drawDetectionBoundary(
      boundaryDetectionLayer,
      stroke.points,
      stroke.closed
    );

    drawVisibleBoundary(
      boundaryLayer,
      stroke.points,
      stroke.closed
    );
  }

  boundaryDetectionLayer.loadPixels();
}

function buildPaintQueue() {
  const queue = [];

  for (let i = 0; i < SETTINGS.fill.attempts; i++) {
    const x = random(width);
    const y = random(height);

    const region =
      floodFillRegion(
        boundaryDetectionLayer,
        x,
        y
      );

    if (!region) continue;

    const regionColor =
      getOrAssignRegionColor(
        region,
        generationRegionColors,
        palette
      );

    queue.push({
      region,
      color: regionColor
    });
  }

  return queue;
}

function updateProgressivePaint() {
  const count =
    SETTINGS.animation.paintEventsPerFrame;

  for (let i = 0; i < count; i++) {

    if (
      animationState.paintAttemptsRemaining <= 0
    ) {
      animationState.phase =
        ANIMATION_PHASE.COMPLETE;

      return;
    }

    animationState.paintAttemptsRemaining--;

    const x = random(width);
    const y = random(height);

    const region =
      floodFillRegion(
        boundaryDetectionLayer,
        x,
        y
      );

    if (!region) {
      continue;
    }

    const regionColor =
      randomColor(palette);

    paintRegion(
      region,
      paintLayer,
      regionColor
    );
  }
}

function updateAnimation() {
  if (!animationState) {
    return;
  }

  switch (animationState.phase) {

    case ANIMATION_PHASE.PARTICLE:
      updateParticlePhase();
      break;

    case ANIMATION_PHASE.BOUNDARY:
      updateBoundaryReveal();
      renderPartialBoundary(
        animationState.boundaryReady
      );
      break;

    case ANIMATION_PHASE.PAINT_PREP:
      if (millis() >= animationState.pauseUntilMs) {
        animationState.paintAttemptsRemaining =
          SETTINGS.fill.attempts;

        animationState.phase =
          ANIMATION_PHASE.PAINT;
      }
      break;

    case ANIMATION_PHASE.PAINT:
      updateProgressivePaint();
      break;

    case ANIMATION_PHASE.COMPLETE:
      setGenerationStatus(false);
      animationState = null;
      break;
  }
}

function updateParticlePhase() {
  const state =
    animationState.particleState;

  if (!state) {
    return;
  }

  for (
    let step = 0;
    step < SETTINGS.animation.particleStepsPerFrame;
    step++
  ) {
    let samples = [];

    if (!state.done) {
      samples =
        stepParticleBoundaryState(state);
    } else {
      moveParticleBoundaryState(state);
    }

    for (
      let i = 0;
      i < state.particles.length;
      i++
    ) {
      const particle =
        state.particles[i];

      const trail =
        animationState.particleTrails[i];

      const previous =
        trail[trail.length - 1];

      const current = {
        x: particle.pos.x,
        y: particle.pos.y
      };

      if (previous) {
        const dx =
          abs(current.x - previous.x);

        const dy =
          abs(current.y - previous.y);

        const wrapped =
          dx > width * 0.5 ||
          dy > height * 0.5;

        if (wrapped) {
          trail.push(null);
        }
      }

      trail.push(current);
    }

    for (const sample of samples) {
      animationState.sampledPoints.push({
        x: sample.point.x,
        y: sample.point.y
      });
    }
  }

  if (state.done) {
    const elapsed =
      millis() - animationState.particleStartMs;

    if (
      elapsed >=
      SETTINGS.animation.particleMinDurationMs
    ) {
      finishParticlePhase();
    }
  }
}

function renderAnimationOverlay() {
  if (!animationState) {
    return;
  }

  if (
    animationState.phase !== ANIMATION_PHASE.PARTICLE
  ) {
    return;
  }

  const state =
    animationState.particleState;

  if (!state) {
    return;
  }

  push();

  // Trails
  if (SETTINGS.animation.showParticleTrail) {
    noFill();

    stroke(
      30,
      SETTINGS.animation.trailAlpha
    );

    strokeWeight(1);

    for (
      const trail of animationState.particleTrails
    ) {
      if (trail.length < 2) {
        continue;
      }

      let drawing = false;

      for (const p of trail) {
        if (p === null) {
          if (drawing) {
            endShape();
            drawing = false;
          }

          continue;
        }

        if (!drawing) {
          beginShape();
          drawing = true;
        }

        vertex(p.x, p.y);
      }

      if (drawing) {
        endShape();
      }
    }
  }

  // Deposited control points
  noStroke();
  fill(20, 180);

  for (
    const p of animationState.sampledPoints
  ) {
    circle(
      p.x,
      p.y,
      SETTINGS.animation.sampleDotSize
    );
  }

  // Current particles
  fill(20);

  for (const particle of state.particles) {
    circle(
      particle.pos.x,
      particle.pos.y,
      8
    );
  }

  pop();
}