let encounterPalette;

let paperColor;
let inkColor;
let coolColor;
let warmColor;
let accentColor;


function initializeMarkSystem() {
  encounterPalette =
    getPalette("evidenceOfEncounter");

  paperColor =
    getColorByRole(
      encounterPalette,
      "paper",
      false
    );

  inkColor =
    getDarkColor(
      encounterPalette
    );

  coolColor =
    getColorByRole(
      encounterPalette,
      "cool",
      false
    );

  warmColor =
    getColorByRole(
      encounterPalette,
      "warm",
      false
    );

  accentColor =
    getAccentColor(
      encounterPalette
    );
}


function renderEncounter(event) {
  switch (event.type) {
    case "approach":
      drawApproachMark(event);
      break;

    case "parallel":
      drawParallelMark(event);
      break;

    case "crossing":
      drawCrossingMark(event);
      break;
  }
}


// --------------------------------------------------
// APPROACH
//
// A transverse interruption.
//
// Stronger encounters produce longer, heavier,
// occasionally doubled marks.
// --------------------------------------------------

function drawApproachMark(event) {
  const style =
    getEmphasisStyle(event);

  const direction = p5.Vector.sub(
    event.b.position,
    event.a.position
  );

  direction.normalize();

  const perpendicular = createVector(
    -direction.y,
    direction.x
  );

  const length =
    lerp(
      10,
      38,
      event.closeness
    ) *
    style.scale;

  const half =
    perpendicular
      .copy()
      .mult(length * 0.5);

  const p1 =
    p5.Vector.sub(
      event.midpoint,
      half
    );

  const p2 =
    p5.Vector.add(
      event.midpoint,
      half
    );

  const hex =
    weightedMarkColor();

  drawHandLine(
    p1,
    p2,
    hex,
    lerp(
      20,
      65,
      event.closeness
    ) * style.alpha,
    lerp(
      0.5,
      1.35,
      event.closeness
    ) * style.weight,
    style.passes
  );

  if (
    event.emphasis !== "ordinary" &&
    random() < 0.45
  ) {
    const offset =
      direction
        .copy()
        .mult(
          random(-4, 4)
        );

    drawHandLine(
      p5.Vector.add(
        p1,
        offset
      ),
      p5.Vector.add(
        p2,
        offset
      ),
      hex,
      random(15, 35) *
        style.alpha,
      random(0.4, 0.9) *
        style.weight,
      max(
        2,
        style.passes - 1
      )
    );
  }
}


// --------------------------------------------------
// PARALLEL
//
// Two related strokes follow the common direction,
// but aren't mechanically identical.
// --------------------------------------------------

function drawParallelMark(event) {
  const style =
    getEmphasisStyle(event);
  
  const direction =
    p5.Vector.add(
      event.a.velocity,
      event.b.velocity
    );

  if (direction.magSq() === 0) {
    return;
  }

  direction.normalize();

  const length =
    lerp(
      12,
      32,
      event.closeness
    ) *
    style.scale;

  const perpendicular =
    createVector(
      -direction.y,
      direction.x
    );

  const spacing =
    lerp(
      2.5,
      6,
      event.closeness
    );

  const hex =
    chooseParallelColor();

  for (const side of [-1, 1]) {
    const center =
      event.midpoint
        .copy()
        .add(
          perpendicular
            .copy()
            .mult(
              spacing * side
            )
        );

    // Don't make the two marks perfectly matched.
    const individualLength =
      length * random(0.82, 1.15);

    const half =
      direction
        .copy()
        .mult(
          individualLength * 0.5
        );

    const p1 =
      p5.Vector.sub(
        center,
        half
      );

    const p2 =
      p5.Vector.add(
        center,
        half
      );

    drawHandLine(
      p1,
      p2,
      hex,
      random(14, 32) *
        style.alpha,
      random(0.35, 0.8) *
        style.weight,
      max(
        2,
        style.passes - 1
      )
    );
  }
}


// --------------------------------------------------
// CROSSING
//
// Instead of p5 arc(), construct a curved gesture
// point-by-point so the encounter leaves a less
// geometric trace.
// --------------------------------------------------

function drawCrossingMark(event) {
  const style =
    getEmphasisStyle(event);
  const headingA =
    event.a.velocity.heading();

  const headingB =
    event.b.velocity.heading();

  let spread =
    abs(
      angleDifference(
        headingA,
        headingB
      )
    );

  spread =
    constrain(
      spread,
      PI / 5,
      PI * 0.85
    );

  const radius =
    lerp(
      8,
      26,
      event.closeness
    ) *
    style.scale;

  const startAngle =
    headingA +
    random(-0.25, 0.25);

  const direction =
    random() < 0.5
      ? -1
      : 1;

  drawHandArc(
    event.midpoint,
    radius,
    startAngle,
    startAngle +
      spread * direction,
    weightedMarkColor(),
    random(18, 48) *
      style.alpha,
    random(0.45, 1.05) *
      style.weight,
    style.passes
  );
}


// --------------------------------------------------
// HAND-DRAWN LINE
//
// Multiple faint irregular passes replace a single
// perfect p5 line.
// --------------------------------------------------

function drawHandLine(
  p1,
  p2,
  hex,
  alpha,
  weight,
  passes = 3
) {
  for (
    let pass = 0;
    pass < passes;
    pass++
  ) {
    drawWobblyLinePass(
      p1,
      p2,
      hex,
      alpha / passes,
      weight * random(0.8, 1.2)
    );
  }
}


function drawWobblyLinePass(
  p1,
  p2,
  hex,
  alpha,
  weight
) {
  const distance =
    p5.Vector.dist(
      p1,
      p2
    );

  const steps =
    max(
      4,
      floor(distance / 4)
    );

  const c =
    color(hex);

  c.setAlpha(alpha);

  markLayer.push();

  markLayer.noFill();
  markLayer.stroke(c);
  markLayer.strokeWeight(weight);
  markLayer.strokeCap(ROUND);

  markLayer.beginShape();

  const noiseOffset =
    random(1000);

  for (
    let i = 0;
    i <= steps;
    i++
  ) {
    const t =
      i / steps;

    let x =
      lerp(
        p1.x,
        p2.x,
        t
      );

    let y =
      lerp(
        p1.y,
        p2.y,
        t
      );

    // Keep endpoints relatively stable while
    // allowing the center to wander more.
    const envelope =
      sin(t * PI);

    const wobble =
      map(
        noise(
          noiseOffset +
          t * 2.5
        ),
        0,
        1,
        -1.5,
        1.5
      );

    const dx =
      p2.x - p1.x;

    const dy =
      p2.y - p1.y;

    const mag =
      sqrt(
        dx * dx +
        dy * dy
      );

    if (mag > 0) {
      const nx =
        -dy / mag;

      const ny =
        dx / mag;

      x +=
        nx *
        wobble *
        envelope;

      y +=
        ny *
        wobble *
        envelope;
    }

    // Tiny irregularity keeps it from feeling
    // mathematically clean.
    x +=
      random(-0.25, 0.25);

    y +=
      random(-0.25, 0.25);

    markLayer.vertex(
      x,
      y
    );
  }

  markLayer.endShape();

  markLayer.pop();
}


function getEmphasisStyle(event) {
  switch (event.emphasis) {

    case "significant":
      return {
        scale: 3.0,
        alpha: 2.5,
        weight: 2.0,
        passes: 5
      };

    case "strong":
      return {
        scale: 1.55,
        alpha: 1.45,
        weight: 1.3,
        passes: 3
      };

    default:
      return {
        scale: 0.85,
        alpha: 0.65,
        weight: 0.8,
        passes: 2
      };
  }
}

// --------------------------------------------------
// HAND-DRAWN ARC
// --------------------------------------------------

function drawHandArc(
  center,
  radius,
  startAngle,
  endAngle,
  hex,
  alpha,
  weight,
  passes = 3
) {

  for (
    let pass = 0;
    pass < passes;
    pass++
  ) {
    const c =
      color(hex);

    c.setAlpha(
      alpha / passes
    );

    markLayer.push();

    markLayer.noFill();
    markLayer.stroke(c);

    markLayer.strokeWeight(
      weight *
      random(0.8, 1.2)
    );

    markLayer.strokeCap(ROUND);

    markLayer.beginShape();

    const steps = 14;

    const noiseOffset =
      random(1000);

    for (
      let i = 0;
      i <= steps;
      i++
    ) {
      const t =
        i / steps;

      const angle =
        lerp(
          startAngle,
          endAngle,
          t
        );

      const envelope =
        sin(t * PI);

      const radiusVariation =
        map(
          noise(
            noiseOffset +
            t * 2
          ),
          0,
          1,
          -2,
          2
        ) *
        envelope;

      const r =
        radius +
        radiusVariation +
        random(
          -0.25,
          0.25
        );

      const x =
        center.x +
        cos(angle) * r;

      const y =
        center.y +
        sin(angle) * r;

      markLayer.vertex(
        x,
        y
      );
    }

    markLayer.endShape();

    markLayer.pop();
  }
}


// --------------------------------------------------
// COLOR LOGIC
// --------------------------------------------------

function weightedMarkColor() {
  const r =
    random();

  if (r < 0.45) {
    return inkColor;
  }

  if (r < 0.75) {
    return coolColor;
  }

  if (r < 0.90) {
    return warmColor;
  }

  return accentColor;
}


function chooseParallelColor() {
  if (
    random() < 0.7
  ) {
    return coolColor;
  }

  return inkColor;
}