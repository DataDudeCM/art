const ANIMATION_PHASE = {
  IDLE: "idle",
  PARTICLE: "particle",
  BOUNDARY: "boundary",
  PAINT_PREP: "paintPrep",
  PAINT: "paint",
  COMPLETE: "complete"
};

let animationState = null;


// --------------------------------------------------
// State creation
// --------------------------------------------------

function createAnimationCell(
  row,
  col,
  viewport,
  attemptsPerCell
) {
  return {
    row,
    col,
    viewport,

    parameterOverrides: [],

    boundaryReady: null,
    boundaryFinalized: false,

    revealedBoundaryCount: 0,
    lastBoundaryRevealCount: 0,

    particleState: null,
    particleTrails: [],
    sampledPoints: [],

    paintAttemptsRemaining:
      attemptsPerCell
  };
}


function createAnimationState() {
  const grid =
    getActiveGridSettings();

  const cells = [];

  for (
    let row = 0;
    row < grid.rows;
    row++
  ) {
    for (
      let col = 0;
      col < grid.cols;
      col++
    ) {
      const viewport =
        getGridViewport(
          row,
          col,
          grid.rows,
          grid.cols,
          grid.gutter,
          grid.outerMargin
        );

      const cell =
        createAnimationCell(
          row,
          col,
          viewport,
          SETTINGS.fill.attempts
        );

      cell.parameterOverrides =
        buildCellParameterOverrides(
          row,
          col,
          grid.rows,
          grid.cols
        );

      cells.push(cell);
    }
  }

  return {
    phase: ANIMATION_PHASE.IDLE,

    cells,

    particleStartMs: 0,
    pauseUntilMs: 0,

    nextPaintCellIndex: 0
  };
}


// --------------------------------------------------
// Start
// --------------------------------------------------

function startGenerationAnimation() {
  gridStructureData = [];
  animationState =
    createAnimationState();

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  generationRegionColors =
    new Map();

  if (
    SETTINGS.boundary.source ===
    "particleChaikin"
  ) {
    startParticleAnimation();
  } else {
    prepareBoundaryRevealForAllCells();
  }
}


// --------------------------------------------------
// Non-particle boundary preparation
// --------------------------------------------------

function prepareBoundaryRevealForAllCells() {
  for (const cell of animationState.cells) {
    activeViewport =
      cell.viewport;

    const restoreCellOverrides =
      applyCellParameterOverrides(
        cell.parameterOverrides
      );

    const cellSeed =
      getCellSeed(
        generationSeed,
        cell.row,
        cell.col
      );

    randomSeed(cellSeed);
    noiseSeed(cellSeed);

    const boundarySource =
      getActiveBoundarySource();

    const boundary =
      boundarySource.generate();

    restoreCellOverrides();

    cell.boundaryReady =
      boundary;

    cell.revealedBoundaryCount = 0;
    cell.lastBoundaryRevealCount = 0;
    cell.boundaryFinalized = false;

    // Multi-stroke sources such as drawn boundaries
    // don't currently use progressive path reveal.
    if (boundary.strokes) {
      finalizeBoundaryForCell(
        boundary,
        cell.viewport
      );

      cell.boundaryFinalized = true;
    }
  }

  const allFinalized =
    animationState.cells.every(
      cell => cell.boundaryFinalized
    );

  if (allFinalized) {
    boundaryDetectionLayer.loadPixels();

    animationState.pauseUntilMs =
      millis() +
      SETTINGS.animation.pauseAfterBoundaryMs;

    animationState.phase =
      ANIMATION_PHASE.PAINT_PREP;

    return;
  }

  animationState.phase =
    ANIMATION_PHASE.BOUNDARY;
}


// --------------------------------------------------
// Boundary reveal
// --------------------------------------------------

function updateBoundaryReveal() {
  const cellCount =
    max(
      1,
      animationState.cells.length
    );

  // Keep boundary-reveal workload roughly stable
  // as the grid gets larger.
  const pointsPerCell =
    max(
      1,
      floor(
        SETTINGS.animation
          .boundaryRevealPointsPerFrame /
        cellCount
      )
    );

  for (const cell of animationState.cells) {
    if (cell.boundaryFinalized) {
      continue;
    }

    const boundary =
      cell.boundaryReady;

    if (
      !boundary ||
      !boundary.points ||
      boundary.points.length === 0
    ) {
      cell.boundaryFinalized = true;
      continue;
    }

    const total =
      boundary.points.length;

    cell.revealedBoundaryCount =
      min(
        total,
        cell.revealedBoundaryCount +
          pointsPerCell
      );

    renderPartialBoundaryForCell(
      cell
    );

    if (
      cell.revealedBoundaryCount >=
      total
    ) {
      finalizeBoundaryForCell(
        boundary,
        cell.viewport
      );

      cell.boundaryFinalized = true;
    }
  }

  const allComplete =
    animationState.cells.every(
      cell => cell.boundaryFinalized
    );

  if (allComplete) {
    // All cell boundaries now exist in the
    // shared detection layer.
    boundaryDetectionLayer.loadPixels();

    animationState.pauseUntilMs =
      millis() +
      SETTINGS.animation.pauseAfterBoundaryMs;

    animationState.phase =
      ANIMATION_PHASE.PAINT_PREP;
  }
}


function renderPartialBoundaryForCell(
  cell
) {
  const boundary =
    cell.boundaryReady;

  if (!boundary) {
    return;
  }

  const from =
    max(
      0,
      cell.lastBoundaryRevealCount - 1
    );

  const to =
    cell.revealedBoundaryCount;

  if (to - from < 2) {
    return;
  }

  const newPoints =
    boundary.points.slice(
      from,
      to
    );

  activeViewport =
    cell.viewport;

  drawClippedToViewport(
    boundaryLayer,
    cell.viewport,
    () => {
      drawVisibleBoundary(
        boundaryLayer,
        newPoints,
        false
      );
    }
  );

  cell.lastBoundaryRevealCount =
    cell.revealedBoundaryCount;
}


// --------------------------------------------------
// Final boundary rendering
// --------------------------------------------------

function finalizeBoundaryForCell(
  boundary,
  viewport
) {
  activeViewport =
    viewport;

  // These remain useful for the existing
  // structure/debug display.
  boundaryControlPoints =
    boundary.controlPoints || [];

  boundarySmoothedPoints =
    boundary.points || [];

  gridStructureData.push({
    viewport,
    controlPoints: [
      ...boundaryControlPoints
    ],
    smoothedPoints: [
      ...boundarySmoothedPoints
    ]
  });

  const strokes =
    boundary.strokes || [
      {
        points:
          boundary.points || [],

        closed:
          boundary.closed ?? true
      }
    ];

  for (const stroke of strokes) {
    drawClippedToViewport(
      boundaryDetectionLayer,
      viewport,
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
      viewport,
      () => {
        drawVisibleBoundary(
          boundaryLayer,
          stroke.points,
          stroke.closed
        );
      }
    );
  }
}


// --------------------------------------------------
// Painting
// --------------------------------------------------

function getNextPaintCell() {
  const cells =
    animationState.cells;

  if (!cells.length) {
    return null;
  }

  for (
    let offset = 0;
    offset < cells.length;
    offset++
  ) {
    const index =
      (
        animationState.nextPaintCellIndex +
        offset
      ) %
      cells.length;

    const cell =
      cells[index];

    if (
      cell.paintAttemptsRemaining > 0
    ) {
      animationState.nextPaintCellIndex =
        (index + 1) %
        cells.length;

      return cell;
    }
  }

  return null;
}


function updateProgressivePaint() {
  const eventCount =
    SETTINGS.animation
      .paintEventsPerFrame;

  for (
    let i = 0;
    i < eventCount;
    i++
  ) {
    const cell =
      getNextPaintCell();

    if (!cell) {
      animationState.phase =
        ANIMATION_PHASE.COMPLETE;

      return;
    }

    cell.paintAttemptsRemaining--;

    activeViewport =
      cell.viewport;

    const restoreCellOverrides =
      applyCellParameterOverrides(
        cell.parameterOverrides
      );

    const samplePoint =
      getFillSamplePoint(
        cell.viewport
      );

    const region =
      floodFillRegion(
        boundaryDetectionLayer,
        samplePoint.x,
        samplePoint.y,
        cell.viewport
      );

    if (!region) {
      continue;
    }

    const regionColor =
      getRegionPaintColor(
        region,
        palette
      );

    resolveRegionEvent(
      region,
      paintLayer,
      regionColor
    );
  }
}


// --------------------------------------------------
// Particle animation
// --------------------------------------------------

function startParticleAnimation() {
  animationState.phase =
    ANIMATION_PHASE.PARTICLE;

  animationState.particleStartMs =
    millis();

  for (const cell of animationState.cells) {
    activeViewport =
      cell.viewport;

    const cellSeed =
      getCellSeed(
        generationSeed,
        cell.row,
        cell.col
      );

    randomSeed(cellSeed);
    noiseSeed(cellSeed);

    const restoreCellOverrides =
      applyCellParameterOverrides(
        cell.parameterOverrides
      );

    cell.particleState =
      createParticleBoundaryState(
        cell.viewport
      );

    restoreCellOverrides();

    cell.particleTrails =
      cell.particleState.particles.map(
        particle => [
          {
            x: particle.pos.x,
            y: particle.pos.y
          }
        ]
      );

    cell.sampledPoints = [];
  }
}


function updateParticlePhase() {
  let allDone = true;

  for (const cell of animationState.cells) {
    activeViewport =
      cell.viewport;

    const state =
      cell.particleState;

    if (!state) {
      continue;
    }

    for (
      let step = 0;
      step <
        SETTINGS.animation
          .particleStepsPerFrame;
      step++
    ) {
      let samples = [];

      if (!state.done) {
        samples =
          stepParticleBoundaryState(
            state
          );
      } else {
        moveParticleBoundaryState(
          state
        );
      }

      updateParticleTrails(
        cell
      );

      for (const sample of samples) {
        cell.sampledPoints.push({
          x: sample.point.x,
          y: sample.point.y
        });
      }
    }

    if (!state.done) {
      allDone = false;
    }
  }

  const elapsed =
    millis() -
    animationState.particleStartMs;

  if (
    allDone &&
    elapsed >=
      SETTINGS.animation
        .particleMinDurationMs
  ) {
    finishParticlePhaseForAllCells();
  }
}


function updateParticleTrails(
  cell
) {
  const state =
    cell.particleState;

  const bounds =
    state.bounds;

  const boundsWidth =
    bounds.maxX -
    bounds.minX;

  const boundsHeight =
    bounds.maxY -
    bounds.minY;

  for (
    let i = 0;
    i < state.particles.length;
    i++
  ) {
    const particle =
      state.particles[i];

    const trail =
      cell.particleTrails[i];

    const previous =
      trail[
        trail.length - 1
      ];

    const current = {
      x: particle.pos.x,
      y: particle.pos.y
    };

    if (previous) {
      const dx =
        abs(
          current.x -
          previous.x
        );

      const dy =
        abs(
          current.y -
          previous.y
        );

      const wrapped =
        dx > boundsWidth * 0.5 ||
        dy > boundsHeight * 0.5;

      if (wrapped) {
        trail.push(null);
      }
    }

    trail.push(current);
  }
}


function finishParticlePhaseForAllCells() {
  for (const cell of animationState.cells) {
    activeViewport =
      cell.viewport;

    const controlPoints =
      finalizeParticleBoundaryPoints(
        cell.particleState
      );

    const boundary =
      buildChaikinBoundaryFromControlPoints(
        controlPoints
      );

    cell.boundaryReady =
      boundary;

    cell.revealedBoundaryCount = 0;
    cell.lastBoundaryRevealCount = 0;
    cell.boundaryFinalized = false;
  }

  animationState.phase =
    ANIMATION_PHASE.BOUNDARY;
}


// --------------------------------------------------
// Main animation update
// --------------------------------------------------

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
      break;

    case ANIMATION_PHASE.PAINT_PREP:
      if (
        millis() >=
        animationState.pauseUntilMs
      ) {
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


// --------------------------------------------------
// Particle overlay
// --------------------------------------------------

function renderAnimationOverlay() {
  if (
    !animationState ||
    animationState.phase !==
      ANIMATION_PHASE.PARTICLE
  ) {
    return;
  }

  for (const cell of animationState.cells) {
    renderParticleCellOverlay(
      cell
    );
  }
}


function renderParticleCellOverlay(
  cell
) {
  const state =
    cell.particleState;

  if (!state) {
    return;
  }

  push();

  const ctx =
    drawingContext;

  ctx.save();
  ctx.beginPath();

  ctx.rect(
    cell.viewport.x,
    cell.viewport.y,
    cell.viewport.width,
    cell.viewport.height
  );

  ctx.clip();

  // Trails
  if (
    SETTINGS.animation
      .showParticleTrail
  ) {
    noFill();

    stroke(
      30,
      SETTINGS.animation
        .trailAlpha
    );

    strokeWeight(1);

    for (
      const trail of
        cell.particleTrails
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

        vertex(
          p.x,
          p.y
        );
      }

      if (drawing) {
        endShape();
      }
    }
  }

  // Sampled control points
  noStroke();
  fill(20, 180);

  for (
    const p of cell.sampledPoints
  ) {
    circle(
      p.x,
      p.y,
      SETTINGS.animation
        .sampleDotSize
    );
  }

  // Current particles
  fill(20);

  for (
    const particle of
      state.particles
  ) {
    circle(
      particle.pos.x,
      particle.pos.y,
      8
    );
  }

  ctx.restore();

  pop();
}