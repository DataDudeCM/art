class Agent {
  constructor(id) {
    this.id = id;

    this.position = createVector(
      random(width),
      random(height)
    );

    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(0.7, 1.8));

    this.maxSpeed = random(1.4, 2.2);
    this.steerStrength = random(0.015, 0.035);

    // Individual coordinates into the shared noise field.
    this.noiseX = random(1000);
    this.noiseY = random(1000);
  }

  update() {
    this.applyNoiseSteering();

    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);

    this.wrapEdges();
  }

  applyNoiseSteering() {
    const noiseScale = 0.004;

    const n = noise(
      this.position.x * noiseScale + this.noiseX,
      this.position.y * noiseScale + this.noiseY
    );

    const angle = map(
      n,
      0,
      1,
      -PI,
      PI
    );

    const desired = p5.Vector.fromAngle(angle);
    desired.mult(this.maxSpeed);

    const steer = p5.Vector.sub(
      desired,
      this.velocity
    );

    steer.limit(this.steerStrength);

    this.velocity.add(steer);
  }

  wrapEdges() {
    if (this.position.x < 0) {
      this.position.x = width;
    }

    if (this.position.x > width) {
      this.position.x = 0;
    }

    if (this.position.y < 0) {
      this.position.y = height;
    }

    if (this.position.y > height) {
      this.position.y = 0;
    }
  }

  show() {
    const agentColor = getColorByRole(
      encounterPalette,
      "warm",
      false
    );

    push();

    translate(
      this.position.x,
      this.position.y
    );

    rotate(
      this.velocity.heading()
    );

    const c = color(agentColor);
    c.setAlpha(160);

    stroke(c);
    strokeWeight(1);

    line(0, 0, 8, 0);

    noStroke();
    fill(c);

    circle(0, 0, 4);

    pop();
  }
}