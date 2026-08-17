const ENCOUNTER_DISTANCE = 48;

const APPROACH_THRESHOLD = -0.55;

const PARALLEL_ANGLE = Math.PI / 8;

const ENCOUNTER_COOLDOWN = 18;


// Tracks when a pair last produced a mark.
const encounterHistory = new Map();

function wrappedSeparation(a, b) {
  let dx =
    b.position.x -
    a.position.x;

  let dy =
    b.position.y -
    a.position.y;

  if (dx > width / 2) {
    dx -= width;
  }

  if (dx < -width / 2) {
    dx += width;
  }

  if (dy > height / 2) {
    dy -= height;
  }

  if (dy < -height / 2) {
    dy += height;
  }

  return createVector(dx, dy);
}

function getEncounterEmphasis(closeness) {
  if (closeness > 0.78) {
    return "significant";
  }

  if (closeness > 0.48) {
    return "strong";
  }

  return "ordinary";
}

function detectEncounters(agents) {
  for (let i = 0; i < agents.length - 1; i++) {

    const a = agents[i];

    for (let j = i + 1; j < agents.length; j++) {

      const b = agents[j];

      const separation =
        wrappedSeparation(a, b);

      const d =
        separation.mag();

      if (d > ENCOUNTER_DISTANCE) {
        continue;
      }

      const pairKey = getPairKey(a, b);

      if (!pairReady(pairKey)) {
        continue;
      }

      const event = classifyEncounter(
        a,
        b,
        d
      );

      if (!event) {
        continue;
      }

      // We deliberately do NOT record every valid encounter.
      //
      // Selective evidence keeps the drawing from becoming
      // a complete mess within thirty seconds.

      if (random() < encounterRecordChance(event)) {

        renderEncounter(event);

        encounterHistory.set(
          pairKey,
          frameCount
        );
      }
    }
  }
}


function classifyEncounter(a, b, distance) {

  const separation =
    wrappedSeparation(a, b);

  const relativeVelocity = p5.Vector.sub(
    b.velocity,
    a.velocity
  );


  // -------------------------------------------
  // APPROACHING
  //
  // If relative velocity points strongly
  // opposite the separation vector, the
  // agents are moving toward each other.
  // -------------------------------------------

  const closing = separation
    .copy()
    .normalize()
    .dot(
      relativeVelocity.copy().normalize()
    );


  if (closing < APPROACH_THRESHOLD) {

    return makeEncounterEvent(
      "approach",
      a,
      b,
      distance
    );
  }


  // -------------------------------------------
  // PARALLEL
  // -------------------------------------------

  const headingDifference =
    abs(
      angleDifference(
        a.velocity.heading(),
        b.velocity.heading()
      )
    );


  if (headingDifference < PARALLEL_ANGLE) {

    return makeEncounterEvent(
      "parallel",
      a,
      b,
      distance
    );
  }


  // -------------------------------------------
  // CROSSING / SEPARATING
  //
  // For v0.1 everything else gets interpreted
  // as a crossing-type relationship.
  // -------------------------------------------

  return makeEncounterEvent(
    "crossing",
    a,
    b,
    distance
  );
}


function makeEncounterEvent(
  type,
  a,
  b,
  distance
) {

  const separation =
    wrappedSeparation(a, b);

  const midpoint =
    a.position
      .copy()
      .add(
        separation.copy().mult(0.5)
      );

  // Wrap the midpoint back onto the canvas.
  midpoint.x =
    (midpoint.x + width) % width;

  midpoint.y =
    (midpoint.y + height) % height;


  const closeness = constrain(
    1 - distance / ENCOUNTER_DISTANCE,
    0,
    1
  );


  return {
    type,

    a,
    b,

    midpoint,

    distance,
    closeness,

    emphasis:
      getEncounterEmphasis(closeness)
  };
}


function encounterRecordChance(event) {

  switch (event.type) {

    case "approach":
      return 0.24;

    case "parallel":
      return 0.12;

    case "crossing":
      return 0.16;

    default:
      return 0;
  }
}


function getPairKey(a, b) {
  return `${a.id}:${b.id}`;
}


function pairReady(pairKey) {

  const lastFrame =
    encounterHistory.get(pairKey);

  if (lastFrame === undefined) {
    return true;
  }

  return (
    frameCount - lastFrame >
    ENCOUNTER_COOLDOWN
  );
}


function angleDifference(a, b) {

  let difference = a - b;

  while (difference > PI) {
    difference -= TWO_PI;
  }

  while (difference < -PI) {
    difference += TWO_PI;
  }

  return difference;
}