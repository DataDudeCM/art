const ENCOUNTER_DISTANCE = 48;

const APPROACH_THRESHOLD = -0.55;

const PARALLEL_ANGLE = Math.PI / 8;

const ENCOUNTER_COOLDOWN = 18;


// Tracks when a pair last produced a mark.
const encounterHistory = new Map();


function detectEncounters(agents) {
  for (let i = 0; i < agents.length - 1; i++) {

    const a = agents[i];

    for (let j = i + 1; j < agents.length; j++) {

      const b = agents[j];

      const d = p5.Vector.dist(
        a.position,
        b.position
      );

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

  const separation = p5.Vector.sub(
    b.position,
    a.position
  );

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

  const midpoint = p5.Vector.add(
    a.position,
    b.position
  ).mult(0.5);


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

    closeness
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