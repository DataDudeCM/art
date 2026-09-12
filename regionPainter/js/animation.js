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

  if (SETTINGS.boundary.source === "particleChaikin") {
    animationState.phase =
      ANIMATION_PHASE.PARTICLE;

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

    queue.push({
      region,
      color: randomColor(palette)
    });
  }

  return queue;
}

function updateProgressivePaint() {
  const count =
    SETTINGS.animation.paintEventsPerFrame;

  for (let i = 0; i < count; i++) {
    if (
      animationState.paintQueue.length === 0
    ) {
      animationState.phase =
        ANIMATION_PHASE.COMPLETE;
      return;
    }

    const event =
      animationState.paintQueue.shift();

    paintRegion(
      event.region,
      paintLayer,
      event.color
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
        animationState.paintQueue =
          buildPaintQueue();

        animationState.phase =
          ANIMATION_PHASE.PAINT;
      }
      break;

    case ANIMATION_PHASE.PAINT:
      updateProgressivePaint();
      break;

    case ANIMATION_PHASE.COMPLETE:
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
    const samples =
      stepParticleBoundaryState(state);

    for (
      let i = 0;
      i < state.particles.length;
      i++
    ) {
      const particle =
        state.particles[i];

      animationState.particleTrails[i].push({
        x: particle.pos.x,
        y: particle.pos.y
      });
    }

    for (const sample of samples) {
      animationState.sampledPoints.push({
        x: sample.point.x,
        y: sample.point.y
      });
    }

    if (state.done) {
      finishParticlePhase();
      return;
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

      beginShape();

      for (const p of trail) {
        vertex(p.x, p.y);
      }

      endShape();
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