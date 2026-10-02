//
// SPAG v2
// SpagStrand
//
// One strand owns:
//
//   position
//   velocity
//   width
//   movement
//   aging
//   branching
//
// It does NOT know about the global strand array.
//

class SpagStrand {

  constructor({
    position,
    velocity,
    width,
    color,
    inkColor,
    movement,
    branchChance
  }) {

    this.position = position.copy();
    this.velocity = velocity.copy();

    this.initialWidth = width;
    this.width = width;

    this.color = color;
    this.inkColor = inkColor;

    this.movement = movement;

    this.branchChance = branchChance;

    this.noiseStart = random(1000, 100000);

    this.age = 0;

    this.alive = true;

    this.prevSection = null;
  }


  // --------------------------------------------------
  // Main update
  // --------------------------------------------------

  update() {

    if (!this.alive) {
      return null;
    }

    this.age++;

    this.updateDirection();

    this.position.add(this.velocity);

    this.width *= this.movement.widthDecay;

    this.checkBounds();

    if (this.width < this.movement.minWidth) {
      this.alive = false;
    }

    if (!this.alive) {
      return null;
    }

    return this.tryBranch();
  }


  // --------------------------------------------------
  // Noise-driven steering
  // --------------------------------------------------

  updateDirection() {

    const progress = constrain(
      1 - this.width / this.initialWidth,
      0,
      1
    );

    /*
     * The old SPAG gradually became curlier as
     * the strand aged.
     *
     * Preserve that behavior explicitly.
     */

    const turnRange = lerp(
      this.movement.turnStart,
      this.movement.turnEnd,
      progress
    );

    const n = noise(
      this.noiseStart +
      this.age * this.movement.noiseScale
    );

    const turn = map(
      n,
      0,
      1,
      -turnRange,
      turnRange
    );

    this.velocity.rotate(turn);

    this.velocity.limit(
      this.movement.maxSpeed
    );
  }


  // --------------------------------------------------
  // Branching
  // --------------------------------------------------

  tryBranch() {

    if (this.age < this.movement.minBranchAge) {
      return null;
    }

    if (random() >= this.branchChance) {
      return null;
    }

    const childVelocity =
      this.velocity.copy();

    childVelocity.rotate(
      random(
        -this.movement.branchAngle,
        this.movement.branchAngle
      )
    );

    const childPosition =
      this.position.copy();

    /*
     * Move the child slightly away from the parent
     * so both aren't stamped directly on top of
     * one another.
     */

    const offset =
      childVelocity.copy();

    offset.normalize();
    offset.mult(this.width * 0.35);

    childPosition.add(offset);

    return new SpagStrand({

      position: childPosition,

      velocity: childVelocity,

      width:
        this.width *
        random(0.88, 1.02),

      color: this.color,

      inkColor: this.inkColor,

      movement: this.movement,

      branchChance: constrain(
        this.branchChance *
        random(0.75, 1.35),
        0,
        this.movement.maxBranchChance
      )
    });
  }


  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  render(brushImg, renderSettings) {

  if (!this.alive) {
    return;
  }

  const section = this.getCrossSection();

  /*
   * Interior fill:
   * use brush only sometimes so we keep texture,
   * but don't lose all structural clarity.
   */
  if (random() <= renderSettings.markChance) {

    const useBrush =
      renderSettings.brushEnabled &&
      brushImg &&
      this.age % renderSettings.brushEvery === 0;

    if (useBrush) {

      paintStrokeBetween(
        brushImg,
        section.p1.x,
        section.p1.y,
        section.p2.x,
        section.p2.y,
        {
          height: max(
            2,
            this.width * renderSettings.brushThickness
          ),
          color: this.color,
          alpha: renderSettings.brushAlpha,
          count: 0,
          angleJitter: 0,
          scaleJitter: 0
        }
      );

    } else {

      const fillCol = color(this.color);
      fillCol.setAlpha(renderSettings.fiberAlpha);

      stroke(fillCol);
      strokeWeight(renderSettings.fiberWeight);

      line(
        section.p1.x,
        section.p1.y,
        section.p2.x,
        section.p2.y
      );
    }
  }

  /*
   * Draw the two strand edges continuously.
   * This is the key change that restores
   * the feeling of spaghetti / wires / tubes.
   */
  if (this.prevSection) {

    const edgeCol = color(this.inkColor);
    edgeCol.setAlpha(renderSettings.edgeAlpha);

    stroke(edgeCol);
    strokeWeight(
      max(
        renderSettings.minEdgeWeight,
        this.width * renderSettings.edgeWeightScale
      )
    );

    // left edge
    line(
      this.prevSection.p1.x,
      this.prevSection.p1.y,
      section.p1.x,
      section.p1.y
    );

    // right edge
    line(
      this.prevSection.p2.x,
      this.prevSection.p2.y,
      section.p2.x,
      section.p2.y
    );
  }

  /*
   * Optional endpoint dots.
   * These help preserve the sketchy/handmade feel.
   */
  const dotCol = color(this.inkColor);
  dotCol.setAlpha(renderSettings.dotAlpha);

  stroke(dotCol);
  strokeWeight(
    max(
      renderSettings.minDotWeight,
      this.width * renderSettings.dotWeightScale
    )
  );

  point(section.p1.x, section.p1.y);
  point(section.p2.x, section.p2.y);

  this.prevSection = {
    p1: section.p1.copy(),
    p2: section.p2.copy()
  };
}


  // --------------------------------------------------
  // Perpendicular cross-section
  // --------------------------------------------------

  getCrossSection() {

    const normal =
      createVector(
        -this.velocity.y,
        this.velocity.x
      );

    if (normal.magSq() === 0) {
      normal.set(1, 0);
    }

    normal.normalize();

    normal.mult(
      this.width * 0.5
    );

    return {

      p1: createVector(
        this.position.x + normal.x,
        this.position.y + normal.y
      ),

      p2: createVector(
        this.position.x - normal.x,
        this.position.y - normal.y
      )
    };
  }


  // --------------------------------------------------
  // Bounds
  // --------------------------------------------------

  checkBounds() {

    const b =
      this.movement.boundary;

    if (
      this.position.x > width + b ||
      this.position.x < -b ||
      this.position.y > height + b ||
      this.position.y < -b
    ) {

      this.alive = false;
    }
  }
}