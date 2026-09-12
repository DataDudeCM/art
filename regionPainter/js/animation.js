const ANIMATION_PHASE = {
  IDLE: "idle",
  PARTICLE: "particle",
  BOUNDARY: "boundary",
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
    revealedBoundaryPoints: [],

    boundaryReady: null,
    paintQueue: [],

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
    animationState.phase = ANIMATION_PHASE.PARTICLE;
    animationState.particleState =
      createParticleBoundaryState();
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
  animationState.phase = ANIMATION_PHASE.BOUNDARY;
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
  animationState.phase = ANIMATION_PHASE.BOUNDARY;
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
  boundaryLayer.clear();

  const partialPoints =
    boundary.points.slice(
      0,
      animationState.revealedBoundaryCount
    );

  if (partialPoints.length < 2) return;

  drawVisibleBoundary(
    boundaryLayer,
    partialPoints,
    false
  );
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